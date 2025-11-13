FROM node:18-alpine

WORKDIR /app

# Install Python and pip for PDF table extraction
RUN apk add --no-cache python3 py3-pip

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Install Python dependencies for PDF table extraction
RUN pip3 install --no-cache-dir pdfplumber pandas --break-system-packages

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3000

CMD ["npm", "start"]
