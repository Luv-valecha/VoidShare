FROM node

WORKDIR /backend
COPY package*.json ./

RUN npm install
RUN npm install express@latest


COPY . .

EXPOSE 4000

CMD ["npm", "start"]
