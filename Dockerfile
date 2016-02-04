FROM node:0.12.7

RUN mkdir /root/app
ADD . /root/app
RUN cd /root/app && npm cache clean && npm install

WORKDIR /root/app
CMD ["/root/app/node_modules/.bin/forever","/root/app/server.js"]
