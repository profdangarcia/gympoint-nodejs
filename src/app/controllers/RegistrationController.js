import * as Yup from 'yup';
import { parseISO, addMonths } from 'date-fns';
import Plan from '../models/Plan';
import Student from '../models/Student';
import Registration from '../models/Registration';

class RegistrationController {
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

    const studentExists = await Student.findByPk(student_id);
    if (!studentExists) {
      return res.status(400).json({ error: 'Student does not exist.' });
    }

    const selectedPlan = await Plan.findByPk(plan_id);
    if (!selectedPlan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const registrationExists = await Registration.findOne({
      where: { student_id },
    });
    if (registrationExists) {
      return res
        .status(400)
        .json({ error: 'Student already has a Registration.' });
    }

    const { duration, total } = selectedPlan;
    const end_date = addMonths(parseISO(start_date), duration);

    const registration = await Registration.create({
      student_id,
      plan_id,
      start_date,
      end_date,
      price: total,
    });
    return res.json(registration);
  }
}

export default new RegistrationController();
