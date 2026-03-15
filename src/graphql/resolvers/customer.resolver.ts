import axios from 'axios'
import { GraphQLError } from 'graphql'
import { GraphQLContext, requireAuth } from '../context'

const CRM_URL = process.env.CLIENTS_SERVICE_URL || 'http://localhost:8003'

export const customerResolvers = {
  Query: {
    customer: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      requireAuth(context)
      try {
        const { data } = await axios.get(`${CRM_URL}/api/clientes/${id}`, {
          headers: { Authorization: `Bearer ${context.token}` }
        })
        return data
      } catch (err: any) {
        if (err.response?.status === 404) {
          throw new GraphQLError('Cliente no encontrado', {
            extensions: { code: 'NOT_FOUND', http: { status: 404 } }
          })
        }
        throw new GraphQLError('Error obteniendo cliente', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        })
      }
    },

    customers: async (
      _: unknown,
      { pagina = 1, limite = 10, busqueda = '' }: { pagina?: number; limite?: number; busqueda?: string },
      context: GraphQLContext
    ) => {
      requireAuth(context)
      const { data } = await axios.get(`${CRM_URL}/api/clientes`, {
        params: { pagina, limite, busqueda },
        headers: { Authorization: `Bearer ${context.token}` }
      })
      return data
    }
  },

  Mutation: {
    createCustomer: async (_: unknown, { input }: { input: Record<string, unknown> }, context: GraphQLContext) => {
      requireAuth(context)
      const { data } = await axios.post(`${CRM_URL}/api/clientes`, input, {
        headers: { Authorization: `Bearer ${context.token}` }
      })
      return data
    },

    updateCustomer: async (
      _: unknown,
      { id, input }: { id: string; input: Record<string, unknown> },
      context: GraphQLContext
    ) => {
      requireAuth(context)
      const { data } = await axios.put(`${CRM_URL}/api/clientes/${id}`, input, {
        headers: { Authorization: `Bearer ${context.token}` }
      })
      return data
    },

    deleteCustomer: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      requireAuth(context)
      await axios.delete(`${CRM_URL}/api/clientes/${id}`, {
        headers: { Authorization: `Bearer ${context.token}` }
      })
      return true
    }
  }
}
