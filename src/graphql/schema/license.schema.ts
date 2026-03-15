import { gql } from 'graphql-tag'

export const licenseTypeDefs = gql`
  type License {
    id: ID!
    modulo: String!
    moduloNombre: String
    activo: Boolean!
    fechaVencimiento: String
    maxUsuarios: Int
    clienteId: ID!
  }

  extend type Query {
    myLicenses: [License!]!
    checkModule(modulo: String!): Boolean!
  }
`
