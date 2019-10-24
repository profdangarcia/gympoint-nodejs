import * as Yup from 'yup';
import Plan from '../models/Plan';

class PlanController {
  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      duration: Yup.number()
        .integer()
        .required(),
      price: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fails' });
    }

    const planExists = await Plan.findOne({
      where: { title: req.body.title },
    });
    if (planExists) {
      return res
        .status(400)
        .json({ error: 'Plan with this title already exists.' });
    }

    const { id, title, duration, price } = await Plan.create(req.body);
    return res.json({
      id,
      title,
      duration,
      price,
    });
  }

  async index(req, res) {
    const plans = await Plan.findAll({
      attributes: ['id', 'title', 'price', 'duration', 'total'],
      order: ['duration'],
    });
    return res.json(plans);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      duration: Yup.number().integer(),
      price: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fails' });
    }

    const plan = await Plan.findByPk(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'plan does not exist' });
    }

    const { title } = req.body;

    if (title !== plan.title) {
      const planExists = await Plan.findOne({ where: { title } });
      if (planExists) {
        return res.status(400).json({ error: 'title already in use.' });
      }
    }

    const { id, duration, price, total } = await plan.update(req.body);

    return res.json({
      id,
      title,
      duration,
      price,
      total,
    });
  }

  async delete(req, res) {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'plan does not exist' });
    }
    await plan.destroy();
    return res.status(200).send();
  }
}

export default new PlanController();
