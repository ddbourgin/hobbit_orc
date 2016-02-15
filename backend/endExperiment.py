#!/usr/bin/env python

import json
import MySQLdb
import cgi
import time

class DB_Connection(object):
    def __init__(self, database="hobbit_orcs", host="localhost"):
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


def end_experiment(query):
    """
    Log final ps data into db, mark
    """
    con = DB_Connection()

    if query['completed'] == 1:
        # update cond database to ensure condition is not reused
        sql = "UPDATE cond SET `status`='Completed' WHERE id = %s"
        args = (query['condID'],)
        con.cursor.execute(sql, args)
        con.db.commit()

        # mark subject responses as complete and log final time
        sql = "UPDATE subjects SET `lastTime`=%s, `completed`='True', `status`='Completed' WHERE id = %s"
        args = (time.strftime('%Y-%m-%d %H:%M:%S'), query['subjectID'])
        con.cursor.execute(sql, args)
        con.db.commit()

    else:
        # update cond database to free up condition for future subjects
        sql = "UPDATE cond SET `status`='Accepting' WHERE id = %s"
        args = (query['condID'],)
        con.cursor.execute(sql, args)
        con.db.commit()

        # mark subject responses as incomplete and log last time
        sql = "UPDATE subjects SET `lastTime`=%s, `completed`='False', `status`='Incomplete' WHERE id = %s"
        args = (time.strftime('%Y-%m-%d %H:%M:%S'), query['subjectID'])
        con.cursor.execute(sql, args)
        con.db.commit()

    print "Content-type: text/html\n"
    return True

if __name__ == '__main__':
    form = cgi.FieldStorage()
    JSONinput = form["query"].value
    end_experiment(json.loads(JSONinput))
