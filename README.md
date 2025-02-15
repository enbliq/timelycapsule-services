# timelycapsule

TimelyCapsule is a web-based application that empowers users to create, seal, and send time-locked messages or media capsules. These capsules unlock at a specified date and time and can include text, images, videos, or cryptocurrency payments. The application is designed to provide an engaging and customizable experience while maintaining flexibility for both registered and guest users.

## Features

- Create and send time-locked messages or media capsules
- Support for text, images, videos, and cryptocurrency payments
- Engaging and customizable user experience
- Accessibility for recipients without requiring an account
- Hybrid Web2 and Web3 architecture

## Architecture

TimelyCapsule utilizes a hybrid architecture:

- **Web2**: Capsule integrity and storage management
- **Web3**: Handling subscription payments, in-app purchases, and optional cryptocurrency gifting

## Getting Started

To get started with TimelyCapsule, follow the instructions below.

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Setting Up the Project

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/timelycapsule.git --depth 1
   cd timelycapsule
   ```

# Docker Environment Setup

This guide explains how to start the development environment for the project using Docker Compose. It includes setting up the backend, database, and frontend services.

## Prerequisites

- Docker installed on your machine (2.10+ recommended).
- Docker Compose installed (v2.0+ recommended).
- Ensure port **27017** is available for the PostgreSQL container.

### Version Requirements

1. **Check Docker version:**

   ```sh
   docker --version
   # Should output something like: Docker version 24.0.7, build afdd53b
   ```

   If your version is below 20.10.0, please update Docker following the [official upgrade guide](https://docs.docker.com/engine/install/).

2. **Check Docker Compose version:**

   ```sh
   # For Docker Compose V2
   docker compose version
   # Should output something like: Docker Compose version v2.21.0
   ```

   If you get a "command not found" error, you might have the older version. Check with:

   ```sh
   docker compose version
   ```

### Installing/Updating Docker

1. **For Ubuntu/Debian:**

   ```sh
   # Remove old versions
   sudo apt-get remove docker docker-engine docker.io containerd runc

   # Install latest version
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

2. **For Windows/Mac:**

   - Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

3. **For other systems:**
   - Follow the [official Docker installation guide](https://docs.docker.com/engine/install/)

## Starting the Development Environment

1. **Clone the Repository**

   ```sh
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Build and Start Services**

   To build and run the entire development environment, use the following command:

   ```sh
   docker compose up --build
   ```

   This command will:

   - Start the backend and PostgreSQL database containers.

3. **Access the Application**

   - **Backend API**: Accessible at [http://localhost:3000](http://localhost:3000).
   - **PostgreSQL Database**: Accessible at `localhost:27017` (make sure to use the `MONGO_USER`, `DB_NAME` and `MONGO_PASSWORD` from the `.env` file).
