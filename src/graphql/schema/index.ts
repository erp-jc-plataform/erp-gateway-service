import { gql } from 'graphql-tag'
import { customerTypeDefs } from './customer.schema'
import { licenseTypeDefs } from './license.schema'

const baseTypeDefs = gql`
  type Query
  type Mutation
`

export const typeDefs = [baseTypeDefs, customerTypeDefs, licenseTypeDefs]
