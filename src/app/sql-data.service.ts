import { Injectable } from '@angular/core';
import { EOperate, ESqlSummary } from './OperType';

@Injectable({
  providedIn: 'root'
})
export class SqlDataService {
  _db: any;
  constructor() {
    this._db = (window as any).openDatabase('lv1', '1.0', 'sqlite history', 5 * 1024 * 1024);
    this._db.transaction(function(tx: any) {
      tx.executeSql("CREATE TABLE IF NOT EXISTS RS(id integer primary key autoincrement,mdate integer, mtype integer,mvalid integer,minvalid integer)");
      // tx.executeSql("INSERT INTO USER (id, name) VALUES (?,?)", [1, "peter"]);
      // tx.executeSql("INSERT INTO USER (id, name) VALUES (?,?)", [2, "paul"]);

      // tx.executeSql("SELECT * FROM USER", [], (transaction, result) => {
      //   console.log(result.rows.item(0));
      //   console.log(result.rows.item(1));
      // },
      //   (transaction, error) => {

      //   }
      // );

    });
  }
  getDateValue(inc: number): number {
    var a = new Date();
    a.setDate(a.getDate() + inc);
    var d = a.getDate()
    var m = a.getMonth() + 1;

    var y = parseInt(((a.getFullYear() / 100) + "").split(/[^0-9]/)[1]);
    var fully = y * 1e4 + m * 1e2 + d;
    return fully;
  }
  // return 7 day nearest data
  getSummary(): Promise<ESqlSummary[]> {
    return new Promise((resolve, reject) => {
      var fromY = this.getDateValue(-7);
      var toY = this.getDateValue(0);
      this._db.transaction((tx: any) => {
        tx.executeSql(`SELECT *  FROM RS WHERE mdate>=? and mdate <=?`, [fromY, toY], (_transaction: any, result: any) => {
          var book, i, rs = [], booksNumber = result.rows.length;
          for (i = 0; i < booksNumber; i++) {
            book = result.rows.item(i);
            rs.push(book);
          }
          resolve(rs);
        }, (tr: any, e: any) => {
          console.log(e);
          reject();
        })
      });
    })
  }
  update(operator: EOperate, valid: boolean): Promise<void> {
    return new Promise((resolve, reject) => {

      var fully = this.getDateValue(0);
      this._db.transaction((tx: any) => {
        tx.executeSql(`SELECT count(*) as count  FROM RS WHERE mdate=? and mtype=?`, [fully, operator], (_transaction: any, result: any) => {
          var row = result.rows.item(0);

          if (row.count == 0) {
            tx.executeSql(`INSERT INTO RS (mdate, mtype,mvalid,minvalid) VALUES (?,?,?,?)`, [fully, operator, valid ? 1 : 0, !valid ? 1 : 0], () => {
              resolve();
            }, (_: any, e: any) => {
              console.log(e);
              reject();
            });
          } else {
            var fieldName = valid ? "mvalid" : "minvalid";
            tx.executeSql(`UPDATE RS SET  ${fieldName}=${fieldName}+1 WHERE mdate=? AND mtype=?`, [fully, operator]);
          }

        },
          (transaction: any, error: any) => {
            console.log(error);
          }
        );
      });
    })


  }
}