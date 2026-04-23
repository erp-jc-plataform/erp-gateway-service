import { Request } from 'express'
import { GraphQLError } from 'graphql'
import { AuthPayload } from '../types'

export interface GraphQLContext {
  user: AuthPayload | null
  token: string | null
  clienteId: number | null
}

export async function buildContext({ req }: { req: Request }): Promise<GraphQLContext> {
  const token = req.headers.authorization?.replace('Bearer ', '') || null
  return {
    user: req.user || null,
    token,
    clienteId: req.user?.cliente_id ?? null
  }
}

export function requireAuth(context: GraphQLContext): asserts context is GraphQLContext & { user: AuthPayload } {
  if (!context.user) {
    throw new GraphQLError('No autenticado', {
      extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } }
    })
  }
}

export function requireClienteId(context: GraphQLContext): number {
  requireAuth(context)
  if (!context.clienteId) {
    throw new GraphQLError('Usuario sin cliente asignado', {
      extensions: { code: 'FORBIDDEN', http: { status: 403 } }
    })
  }
  return context.clienteId
}
