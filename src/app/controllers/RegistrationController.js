import * as Yup from 'yup';
import { parseISO, addMonths, isBefore, format } from 'date-fns';
import pt from 'date-fns/locale/pt';
import { Op } from 'sequelize';
import Mail from '../../lib/Mail';
import Plan from '../models/Plan';
import Student from '../models/Student';
import Registration from '../models/Registration';

class RegistrationController {
  async index(req, res) {
    const plans = await Registration.findAll({
      attributes: ['id', 'start_date', 'end_date', 'price'],
      include: [
        { model: Student, as: 'student', attributes: ['id', 'name'] },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'title', 'duration', 'price'],
        },
      ],
    });
    return res.json(plans);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number()
        .integer()
        .required(),
      plan_id: Yup.number()
        .integer()
        .required(),
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fails' });
    }
    const { student_id, plan_id, start_date } = req.body;

    const student = await Student.findByPk(student_id);
    if (!student) {
      return res.status(400).json({ error: 'Student does not exist.' });
    }

    const selectedPlan = await Plan.findByPk(plan_id);
    if (!selectedPlan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const registrationExists = await Registration.findOne({
      where: { student_id, canceled_at: { [Op.eq]: null } },
    });
    if (registrationExists) {
      return res
        .status(400)
        .json({ error: 'Student already has a Registration.' });
    }
    const parsedDate = parseISO(start_date);

    if (isBefore(parsedDate, new Date())) {
      return res.status(400).json({ error: 'Past date not permited' });
    }

    const { duration, total } = selectedPlan;
    const end_date = addMonths(parsedDate, duration);

    const registration = await Registration.create({
      student_id,
      plan_id,
      start_date,
      end_date,
      price: total,
    });
    const studentName = student.name;
    const planTitle = selectedPlan.title;
    const planDuration = selectedPlan.duration;
    const returnedRegistration = {
      ...registration.dataValues,
      ...{
        studentName,
        planTitle,
        planDuration,
      },
    };

    await Mail.sendMail({
      to: `${student.name} <${student.email}>`,
      subject: 'Matrícula em GymPoint',
      // text: 'Você tem um novo cancelamento',
      template: 'registration',
      context: {
        student: student.name,
        plan: selectedPlan.title,
        start_date: format(
          parseISO(start_date),
          "'dia' dd 'de' MMMM 'de' yyyy",
          {
            locale: pt,
          }
        ),
        end_date: format(end_date, "'dia' dd 'de' MMMM 'de' yyyy", {
          locale: pt,
        }),
        price: total,
      },
    });

    return res.json(returnedRegistration);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      plan_id: Yup.number().integer(),
      start_date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fails' });
    }

    const registration = await Registration.findByPk(req.params.id, {
      include: [
        { model: Student, as: 'student', attributes: ['id', 'name'] },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'title', 'duration', 'price', 'total'],
        },
      ],
    });

    if (!registration) {
      return res.status(400).json({ error: 'registration does not exists' });
    }

    const { plan_id, start_date } = req.body;

    const parsedDate = parseISO(start_date);

    if (isBefore(parsedDate, new Date())) {
      return res.status(400).json({ error: 'Past date not permited' });
    }

    const selectedPlan = await Plan.findByPk(plan_id);
    if (!selectedPlan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const { duration, total } = selectedPlan;
    const end_date = addMonths(parsedDate, duration);

    const { student_id } = await registration.update({
      start_date,
      end_date,
      price: total,
      plan_id,
    });

    return res.json({
      id: req.params.id,
      plan_id,
      student_id,
      start_date,
      end_date,
      price: total,
    });
  }

  async delete(req, res) {
    const registration = await Registration.findOne({
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name'],
        },
      ],
      where: { canceled_at: { [Op.eq]: null }, id: req.params.id },
    });

    if (!registration) {
      return res
        .status(400)
        .json({ error: 'Registration does not exist or is already canceled.' });
    }

    registration.canceled_at = new Date();

    await registration.save();
    return res.json(registration);
  }
}

export default new RegistrationController();
