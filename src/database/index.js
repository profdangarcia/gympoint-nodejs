import Sequelize from 'sequelize';
import User from '../app/models/User';
import databaseConfig from '../config/database';

const models = [User];

class Database {
  constructor() {
    this.init();
  }

  init() {
    this.connection = new Sequelize(databaseConfig);
    // passamos a conexão para o método INIT de cada MODEL
    models.map(model => model.init(this.connection));
  }
}

export default new Database();
