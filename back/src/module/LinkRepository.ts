import DB from '../components/DBComponent';

class LinkRepository {
  constructor(private readonly db = new DB()) {}

  async getUserByEmail(email: string) {
    return this.db.excecuteNameQuery('getUserByEmail', { email });
  }
}

export default new LinkRepository();
