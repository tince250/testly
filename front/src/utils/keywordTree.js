// Shared helper: turns the flat keyword list (including the course-name root, parent_id === null)
// into lookup structures both the graph and the editable tree can use. The root itself is a real,
// visible node — the tree has exactly one top-level entry: `root`.
export function buildKeywordTree(nodes) {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const childrenById = new Map()
  for (const n of nodes) {
    if (n.parent_id == null) continue
    if (!childrenById.has(n.parent_id)) childrenById.set(n.parent_id, [])
    childrenById.get(n.parent_id).push(n)
  }
  const root = nodes.find((n) => n.parent_id == null) ?? null
  const childrenOf = (id) => childrenById.get(id) ?? []
  return { byId, childrenOf, root }
}
