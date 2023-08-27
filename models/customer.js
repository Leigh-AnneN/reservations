/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** methods for getting/setting notes (keep as empty string, not NULL)  */

  set notes (val) {
    this._notes = val || "";
  }

  get notes () {
    return this._notes;
  }

  /** methods for getting/setting phone #. */

  set phone (val) {
    this._phone = val || null;
  }

  get phone () {
    return this._phone;
  }

  // set firstName (val) {
  //   this._firstName = val || null;
  // }
  
  // get firstName () {
  //   return this._firstName;
  // }

  // set lastName (val) {
  //   this._lastName = val || null;
  // }

  // get lastName () {
  //   return this._lastName;
  // }

  /** find all customers. */

  
  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }


  /**get top ten customers by reservation count */
static async getTopTenCustomers() {
  const results = await db.query(
    `SELECT customers.id, 
            customers.first_name AS "firstName", 
            customers.last_name AS "lastName", 
            COUNT(reservations.id) AS "num_reservations"
    FROM customers
    JOIN reservations ON customers.id = reservations.customer_id
    GROUP BY customers.id
    ORDER BY num_reservations DESC
    LIMIT 10`
  );
  return results.rows.map(c => new Customer(c));
}

    /**search for a customer */
    static async search(searchTerm) {
      const results = await db.query(
        `SELECT id, 
          first_name AS "firstName",  
          last_name AS "lastName", 
          phone, 
          notes 
         FROM customers 
         WHERE (first_name || ' ' || last_name) ILIKE $1`,
        [`%${searchTerm}%`]
      );
      return results.rows.map(c => new Customer(c));
    }
  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }
  /** property to get full name */ 
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  /** get all reservations for this customer. */
  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */
  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }


};

module.exports = Customer;
