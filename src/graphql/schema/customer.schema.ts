import { gql } from 'graphql-tag'

export const customerTypeDefs = gql`
  type Customer {
    id: ID!
    nombre: String!
    email: String!
    telefono: String
    empresa: String
    clienteId: ID
    creadoEn: String
    actualizadoEn: String
  }

  type CustomerPaginado {
    data: [Customer!]!
    total: Int!
    pagina: Int!
    limite: Int!
    totalPaginas: Int!
  }

  input CustomerInput {
    nombre: String!
    email: String!
    telefono: String
    empresa: String
  }

  extend type Query {
    customer(id: ID!): Customer
    customers(pagina: Int, limite: Int, busqueda: String): CustomerPaginado!
  }

  extend type Mutation {
    createCustomer(input: CustomerInput!): Customer!
    updateCustomer(id: ID!, input: CustomerInput!): Customer!
    deleteCustomer(id: ID!): Boolean!
  }
`
