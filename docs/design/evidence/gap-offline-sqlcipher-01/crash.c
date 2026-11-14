#include <sqlite3.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>
static int out(void *d,int c,char **v,char **n){(void)d;(void)c;(void)n;puts(v[0]?v[0]:"NULL");return 0;}
static int run(sqlite3 *db,const char *sql,int cb){char *err=NULL;int rc=exsqlite3_exec(db,sql,cb?out:NULL,NULL,&err);if(rc){fprintf(stderr,"rc=%d: %s\n",rc,err?err:"unknown");exsqlite3_free(err);}return rc;}
int main(int argc,char **argv){if(argc!=2)return 2;sqlite3 *db=NULL;int rc=exsqlite3_open("/tmp/tassla-sqlcipher-crash.db",&db);if(rc)return rc;if(run(db,"PRAGMA key='synthetic-only'; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, value TEXT);",0))return 3;
if(!strcmp(argv[1],"before")){run(db,"BEGIN IMMEDIATE; INSERT INTO t(value) VALUES('SYNTHETIC_UNCOMMITTED_VALUE');",0);_exit(0);}
if(!strcmp(argv[1],"after")){run(db,"BEGIN IMMEDIATE; INSERT INTO t(value) VALUES('SYNTHETIC_COMMITTED_VALUE'); COMMIT;",0);_exit(0);}
if(!strcmp(argv[1],"read")){run(db,"SELECT value FROM t ORDER BY id;",1);exsqlite3_close(db);return 0;}return 2;}
