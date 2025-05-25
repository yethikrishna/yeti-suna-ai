"""
RabbitMQ configuration utility.

This module provides centralized RabbitMQ configuration with proper authentication
using environment variables.
"""

import os
import pika
from dramatiq.brokers.rabbitmq import RabbitmqBroker
import dramatiq
from utils.logger import logger
from urllib.parse import quote


def get_rabbitmq_config():
    """Get RabbitMQ configuration from environment variables."""
    return {
        'host': os.getenv('RABBITMQ_HOST', 'localhost'),
        'port': int(os.getenv('RABBITMQ_PORT', 5672)),
        'user': os.getenv('RABBITMQ_USER', 'guest'),
        'password': os.getenv('RABBITMQ_PASSWORD', 'guest'),
        'vhost': os.getenv('RABBITMQ_VHOST', '/')
    }


def get_rabbitmq_url(config=None):
    """Generate RabbitMQ connection URL with authentication."""
    if config is None:
        config = get_rabbitmq_config()
    
    # URL-encode the password to handle special characters
    encoded_password = quote(config['password'], safe='')
    encoded_vhost = quote(config['vhost'], safe='')
    
    url = f"amqp://{config['user']}:{encoded_password}@{config['host']}:{config['port']}/{encoded_vhost}"
    return url


def get_pika_connection_params(config=None):
    """Get Pika connection parameters with authentication."""
    if config is None:
        config = get_rabbitmq_config()
    
    credentials = pika.PlainCredentials(config['user'], config['password'])
    return pika.ConnectionParameters(
        host=config['host'],
        port=config['port'],
        virtual_host=config['vhost'],
        credentials=credentials,
        heartbeat=600,
        blocked_connection_timeout=300,
    )


def create_rabbitmq_broker(middleware=None):
    """Create and configure a RabbitMQ broker for Dramatiq."""
    config = get_rabbitmq_config()
    url = get_rabbitmq_url(config)
    
    if middleware is None:
        middleware = [dramatiq.middleware.AsyncIO()]
    
    broker = RabbitmqBroker(url=url, middleware=middleware)
    
    logger.info(
        f"RabbitMQ broker configured with host={config['host']}, "
        f"port={config['port']}, user={config['user']}, vhost={config['vhost']}"
    )
    
    return broker


def test_connection():
    """Test RabbitMQ connection with current configuration."""
    try:
        params = get_pika_connection_params()
        connection = pika.BlockingConnection(params)
        connection.close()
        logger.info("RabbitMQ connection test successful")
        return True
    except Exception as e:
        logger.error(f"RabbitMQ connection test failed: {str(e)}")
        return False 