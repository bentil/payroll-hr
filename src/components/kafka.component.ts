import {
  Consumer,
  ConsumerConfig,
  Kafka,
  KafkaConfig,
  Producer,
  ProducerConfig,
} from 'kafkajs';

import config from '../config';
import { KafkaSerializer } from '../utils/kafka-serializer';

export class KafkaService {
  private static instance: KafkaService;

  private client: Kafka | null = null;
  private consumer: Consumer | null = null;
  private producer: Producer | null = null;

  private constructor(
    private readonly options: KafkaConfig,
    private readonly consumerConfig: ConsumerConfig,
    private readonly producerConfig: ProducerConfig
  ) {}

  public static getInstance(): KafkaService {
    if (!KafkaService.instance) {
      KafkaService.instance = new KafkaService(
        {
          brokers: config.kafka.brokers,
          clientId: config.appName,
          connectionTimeout: config.kafka.connectTimeout,
        },
        {
          groupId: config.kafka.groupId || `${config.appName}-group`,
        },
        {
          idempotent: true,
          allowAutoTopicCreation: true,
        }
      );
    }

    return KafkaService.instance;
  }

  public getConsumer(): Consumer {
    if (!this.consumer) {
      this.start();
    }

    return this.consumer!;
  }

  async start(): Promise<void> {
    this.client = this.createClient();
    this.consumer = this.client!.consumer(this.consumerConfig);
    this.producer = this.client!.producer(this.producerConfig);

    await this.consumer.connect();
    await this.producer.connect();
  }

  public async close(): Promise<void> {
    this.consumer && (await this.consumer.disconnect());
    this.producer && (await this.producer.disconnect());
    this.consumer = null;
    this.producer = null;
    this.client = null;
  }

  public async send<T>(
    topic: string,
    data: T,
    key?: any,
    headers?: Record<string, any>
  ): Promise<void> {
    await this.producer?.send({
      topic,
      messages: [
        {
          key: KafkaSerializer.encode(key),
          value: KafkaSerializer.encode(data),
          headers,
        },
      ],
    });
  }

  public createClient() {
    return this.client ?? new Kafka(this.options);
  }

  public async sendList<T>(
    topic: string,
    items: { key?: any; headers?: Record<string, any>; data: T }[]
  ): Promise<void> {
    await this.producer?.send({
      topic,
      messages: items.map(obj => ({
        key: KafkaSerializer.encode(obj.key),
        value: KafkaSerializer.encode(obj.data),
        headers: obj.headers,
      }))
    });
  }

}
