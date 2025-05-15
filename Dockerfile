# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=22.7.0
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Install dependencies once in the base image
RUN apt-get update -qq && apt-get install -y ffmpeg python3 g++ make libffi-dev

# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
# RUN apt-get update -qq && \
#     apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3 python3 g++ make  libffi-dev

# Install build dependencies
RUN apt-get update -qq && \
    apt-get install  -y \
    build-essential \
    ffmpeg \
    python3 \
    make \ 
    g++ \
    libffi-dev && \
    ln -s /usr/bin/python3 /usr/bin/python

# Install node modules
COPY  package.json ./


# Clean previous installations
RUN rm -rf node_modules

# Install dependencies
RUN npm i --ignore-scripts

# Copy application code
COPY . .

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev


# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "npm", "run", "start" ]
