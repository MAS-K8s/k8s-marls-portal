# Use node image as base image
FROM node:22.12.0

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install the application's dependencies

RUN npm install


# Copy the application source code to the container
COPY . .

# Build the Angular application
RUN npm run build

# Serve the built application using an Nginx server
FROM nginx:1.21

    COPY --from=0 /app/dist/cgaas-ng/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]