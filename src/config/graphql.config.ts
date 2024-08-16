import { ApolloDriverConfig, ApolloDriverConfigFactory } from '@nestjs/apollo';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GraphQLDriverOptions implements ApolloDriverConfigFactory {
  constructor(private readonly configService: ConfigService) {}

  createGqlOptions(): Omit<ApolloDriverConfig, 'driver'> {
    return {
      autoSchemaFile: 'schema.gql',
      playground: this.configService.get('testing')
        ? {
            settings: {
              'request.credentials': 'include',
            },
          }
        : false,
      context: ({ req, res }) => ({ req, res }),
      useGlobalPrefix: true,
    };
  }
}
