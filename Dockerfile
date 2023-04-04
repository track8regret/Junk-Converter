##### Build Image #####

FROM node:18 as builder

# Move to working directory /build
WORKDIR /build

# Copy code into container
COPY . .

# Copy and download dependencies with npm
COPY package.json .
COPY package-lock.json .
RUN npm install --no-optional


# Build the application

RUN npm run-script build

##### Deployment Image #####

FROM node:18-alpine

# Move to /bin directory as the place for resulting binary folder
WORKDIR /bin

# COPY --from=deps /deps/node_modules junk-converter/node_modules/
COPY --from=builder /build/dist junk-converter/
WORKDIR /bin/junk-converter
COPY package.json .
COPY package-lock.json .
RUN npm install --no-optional --only=production
EXPOSE 80

# Command to run when starting the container
CMD [ "node", "junk.js" ]