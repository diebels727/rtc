import tornado
import logging
import pprint
import json
import os

from queue import Queue
from tornado import websocket, web, ioloop
from concurrent.futures import ThreadPoolExecutor

root = os.path.dirname(os.path.realpath(__file__))
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

ch = logging.StreamHandler()
formatter = logging.Formatter("[%(levelname)s] %(message)s")
ch.setFormatter(formatter)
logger.addHandler(ch)

executor = ThreadPoolExecutor(4)

queue = Queue()

class SocketHandler(websocket.WebSocketHandler):
  wss = set()

  def check_origin(self, origin):
    return True

  @classmethod
  def send_message(cls, _self, message):
    for ws in cls.wss:
      if ws == _self:
        continue
      logger.debug("writing message to Handler(%s)" % hex(id(ws)))
      ws.write_message(message)

  def send_queue(self, ws):
    while not queue.empty():
      logger.debug("sending queued messages.")
      ws.write_message(queue.get())

  def open(self):
    logger.debug("open.")
    self.wss.add(self)

    message = { 'command': 'set-context', 'context': 'target' }
    if len(list(self.wss)) == 1:
      message['context'] = 'initiator'
    self.write_message(json.dumps(message))

    tornado.ioloop.IOLoop.current().add_callback(self.send_queue, self)

  def on_message(self, message):
    logger.debug("on_message")
    message = json.loads(message)
    if len(list(enumerate(self.wss))) == 1:
      logger.debug("received on_message; queueing message for new clients.")
      logger.debug("   %s" % pprint.pformat(message))
      queue.put(message)
      return
    SocketHandler.send_message(self, message)

  def on_close(self):
    logger.debug("on_close.")
    SocketHandler.wss = set([ws for ws in SocketHandler.wss if ws != self])
    logger.debug("  removed %s" % hex(id(self)))

app = web.Application([
  (r'/ws', SocketHandler),
  (r"/(.*)", tornado.web.StaticFileHandler, \
    {"path": root, "default_filename": "index.html"})
])

if __name__ == '__main__':
  app.listen(8888)
ioloop.IOLoop.instance().start()
