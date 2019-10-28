import * as Yup from 'yup';
import Mail from '../../lib/Mail';
import Student from '../models/Student';
import Helporder from '../models/Helporder';

class AnswerController {
  async store(req, res) {
    const schema = Yup.object().shape({
      answer: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fails' });
    }

    const { questId } = req.params;

    const helpOrder = await Helporder.findOne({
      where: { id: questId, answer: null },
      include: [
        { model: Student, as: 'student', attributes: ['name', 'email'] },
      ],
    });
    if (!helpOrder) {
      return res.status(400).json({ error: 'invalid param' });
    }

    const { answer } = req.body;

    const answeredQuestion = await helpOrder.update({
      answer,
      answer_at: new Date(),
    });

    await Mail.sendMail({
      to: `${answeredQuestion.student.name} <${answeredQuestion.student.email}>`,
      subject: 'Pergunta Respondida em GymPoint',
      template: 'answered',
      context: {
        student: answeredQuestion.student.name,
        question: answeredQuestion.question,
        answer,
      },
    });

    return res.json(answeredQuestion);
  }

  async index(req, res) {
    const noAnswered = await Helporder.findAll({
      where: { answer: null },
      attributes: ['id', 'student_id', 'question'],
      include: [
        { model: Student, as: 'student', attributes: ['name', 'email'] },
      ],
    });

    return res.json(noAnswered);
  }
}

export default new AnswerController();
