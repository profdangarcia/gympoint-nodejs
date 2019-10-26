import { Op } from 'sequelize';
import { differenceInCalendarDays } from 'date-fns';
import Student from '../models/Student';
import Checkin from '../schemas/Checkin';
import Registration from '../models/Registration';

class CheckinController {
  async store(req, res) {
    const student_id = req.params.id;
    const student = await Student.findByPk(student_id);
    if (!student) {
      return res.status(400).json({ error: 'Student does not exist.' });
    }
    const registration = await Registration.findOne({
      where: { student_id, canceled_at: { [Op.eq]: null } },
    });
    if (!registration) {
      return res
        .status(400)
        .json({ error: 'Student does not have a valid registration' });
    }
    /**
     * validatin checkin
     */
    const lastFiveCheckins = await Checkin.find({
      student_id: req.params.id,
    })
      .sort({ createdAt: 'desc' })
      .limit(5);

    if (lastFiveCheckins.length === 5) {
      const lastCheckin = lastFiveCheckins[0];
      const lastArrayCheckin = lastFiveCheckins[lastFiveCheckins.length - 1];

      const interval = differenceInCalendarDays(
        lastCheckin.createdAt,
        lastArrayCheckin.createdAt
      );
      if (interval <= 7) {
        return res.status(403).json({ error: 'Maximum checkins reached ' });
      }
    }

    const checkin = await Checkin.create({
      student_id,
    });

    return res.json(checkin);
  }

  async index(req, res) {
    return res.json();
  }
}

export default new CheckinController();
