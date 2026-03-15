import { customerResolvers } from './customer.resolver'
import { licenseResolvers } from './license.resolver'

export const resolvers = {
  Query: {
    ...customerResolvers.Query,
    ...licenseResolvers.Query
  },
  Mutation: {
    ...customerResolvers.Mutation
  }
}
