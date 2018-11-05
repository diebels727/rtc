import tornado.ioloop
import tornado.web
import logging
import json
import uuid
import os

root = os.path.dirname(os.path.realpath(__file__))
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

ch = logging.StreamHandler()
formatter = logging.Formatter("[%(levelname)s] %(message)s")
ch.setFormatter(formatter)
logger.addHandler(ch)

class DB:
  sdps = {}

class PeersHandler(tornado.web.RequestHandler):
  def get(self, _id):
    peers = {key: value for key, value in DB.sdps.items() if key != _id}
    response = json.dumps(peers)
    self.write(response)

class ICEsHandler(tornado.web.RequestHandler):
  def post(self):
    _id = str(uuid.uuid1())
    data = json.loads(self.request.body)
    DB.sdps[_id] = data
    response = {
      'id': _id,
      'data': data
    }
    logger.debug("Created record for Sdp(%s)." % response['id'])
    self.write(json.dumps(response))
    logger.debug("Sent Response(%s)." % response)

class ICEHandler(tornado.web.RequestHandler):
  def get(self):
    import pdb; pdb.set_trace()

  def post(self):
    import pdb; pdb.set_trace()


application = tornado.web.Application([
  (r"/ices\/*", ICEsHandler),
  (r"/peers\/(.*)", PeersHandler),
  (r"/ice/(.*)", ICEHandler),
  (r"/(.*)", tornado.web.StaticFileHandler, {"path": root, "default_filename": "index.html"})
])

if __name__ == "__main__":
  PORT = 8888
  application.listen(PORT)
  print("Starting up on 0.0.0.0:%s" % PORT)
  tornado.ioloop.IOLoop.instance().start()
