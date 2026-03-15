import axios from 'axios'
import { GraphQLContext, requireClienteId } from '../context'

const LICENSING_URL = process.env.LICENSING_SERVICE_URL || 'http://localhost:3001'

export const licenseResolvers = {
  Query: {
    myLicenses: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const clienteId = requireClienteId(context)
      const { data } = await axios.get(`${LICENSING_URL}/api/licencias/cliente/${clienteId}`, {
        headers: { Authorization: `Bearer ${context.token}` }
      })
      return data
    },

    checkModule: async (_: unknown, { modulo }: { modulo: string }, context: GraphQLContext) => {
      const clienteId = requireClienteId(context)
      try {
        const { data } = await axios.get(
          `${LICENSING_URL}/api/licencias/validate/${clienteId}/${modulo}`,
          { timeout: 5000 }
        )
        return data.valida === true
      } catch {
        return false
      }
    }
  }
}
