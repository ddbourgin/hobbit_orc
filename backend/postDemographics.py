#!/usr/bin/env python

import json
import MySQLdb
import cgi
import time
import random


class DB_Connection(object):

    def __init__(self, database="hobbit_orcs", host="localhost"):
        self.dbname = database
        self.db = MySQLdb.connect(host=host, db=database,
                                  read_default_file='/etc/mysql/my.cnf')
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

    for (name, value) in zip(desc, data):
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


def post_demographics(query):
    """
    Log ps demographics data into db.
    """
    con = DB_Connection()

    sql = \
        """
        INSERT INTO demographics (
            subjectID,
            age,
            gender,
            motivation,
            enjoyment
        ) VALUES (%s, %s, %s, %s, %s)
        """

    args = (query['subjectID'], query['age'],
            query['gender'].strip().lower(), query['motivation'], query['enjoy'])
    con.cursor.execute(sql, args)
    con.db.commit()

    print "Content-type: text/html\n"
    print json.dumps(returnValue, ensure_ascii=False)
    return True

if __name__ == '__main__':
    form = cgi.FieldStorage()
    JSONinput = form["query"].value
    post_demographics(json.loads(JSONinput))
