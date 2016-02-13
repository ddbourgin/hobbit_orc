#!/usr/bin/env python

import json
import MySQLdb
import cgi
import time
import random

class DB_Connection(object):
    def __init__(self, database="jugs", host="localhost"):
        self.dbname = database
        self.db = MySQLdb.connect(host=host, db=database,
                                  read_default_file = '/etc/mysql/my.cnf')
        self.cursor = self.db.cursor()


def fetch_dict(cursor):
    """
    Helper function to get a dict of (column :: value)
    pairs from a MySQLdb.cursor query
    """
    data = cursor.fetchone()
    if data is None:
        return None
    desc = cursor.description
    arr = {}

    for (name, value) in zip(desc, data) :
        arr[name[0]] = value
    return arr


def debug(string):
    """
    For debugging through the browser
    """
    print "Content-type: text/html\n"
    print "<br>"
    print string
    print "<br>"


def get_subject_info(query):
    """
    Log ps bookkeeping data into db, assign subject to a condition,
    calculate approval code, update tables.
    """
    con = DB_Connection()

    # see if workerId / IP address are already in the collection
    sql = "SELECT id FROM subjects WHERE ipAddress = %s OR workerId = %s"
    args = (query['ipAddress'], query['workerId'])
    con.cursor.execute(sql, args)
    returnValue = {}

    if con.cursor.rowcount != 0:
        returnValue['id'] = -1
        returnValue['subjectID'] = -1
        returnValue['approvalCode'] ='denied'

    # if not, enter worker into database and return approval code
    else:
        sql = "SELECT id, cond1, cond2 FROM cond WHERE status = 'Accepting' LIMIT 1"
        con.cursor.execute(sql)
        result = fetch_dict(con.cursor)
        returnValue['condID'] = result['id']
        returnValue['cond1'] = result['cond1'].split(',')
        returnValue['cond2'] = result['cond2'].split(',')

        sql = """INSERT INTO subjects (
                cond1,
                cond2,
                startTime,
                lastTime,
                completed,
                approvalCode,
                userDisplayLanguage,
                userAgent,
                ipAddress,
                country,
                city,
                region,
                workerId,
                status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """

        args = (result['cond1'],
                result['cond2'],
                time.strftime('%Y-%m-%d %H:%M:%S'),
                time.strftime('%Y-%m-%d %H:%M:%S'),
                'False',
                random.randint(100000, 999999),
                query['userDisplayLanguage'],
                query['userAgent'],
                query['ipAddress'],
                query['country'],
                query['city'],
                query['region'],
                query['workerId'],
                'Running' )

        con.cursor.execute(sql, args)
        returnValue['subjectID'] = con.cursor.lastrowid
        con.db.commit()

        # return the approval code plus IP address
        sql = "SELECT approvalCode FROM subjects WHERE id = %s"
        args = (returnValue['subjectID'],)
        con.cursor.execute(sql, args)
        result = fetch_dict(con.cursor)
        returnValue['approvalCode'] = result['approvalCode']

        # update cond table
        sql = "UPDATE cond SET `status`='Running' WHERE id = %s"
        args = (returnValue['condID'],)
        con.cursor.execute(sql, args)
        con.db.commit()

    print "Content-type: text/html\n"
    print json.dumps(returnValue, ensure_ascii=False)
    return True

if __name__ == '__main__':
    form = cgi.FieldStorage()
    JSONinput = form["query"].value
    get_subject_info(json.loads(JSONinput))
