import * as Yup from 'yup';
// import { parseISO, addMonths, isBefore, format } from 'date-fns';
// import pt from 'date-fns/locale/pt';
// import { Op } from 'sequelize';
// import Mail from '../../lib/Mail';
import Student from '../models/Student';
import Helporder from '../models/Helporder';

class HelporderController {
  async store(req, res) {
    const schema = Yup.object().shape({
      question: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fails' });
    }
    const student_id = req.params.id;

    const student = await Student.findByPk(student_id);
    if (!student) {
      return res.status(400).json({ error: 'invalid student' });
    }

    const { id, question } = await Helporder.create({
      student_id,
      question: req.body.question,
    });

    return res.json({ id, question, student_id, student_name: student.name });
  }
}

export default new HelporderController();
