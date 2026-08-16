import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const NODE_COLORS = ['#2E3A4E', '#F4796B', '#7C8CE0', '#3FA88B', '#D9A441']
const SIBLING_SPACING = 210
const LEVEL_SPACING = 84
const MARGIN = { top: 18, right: 46, bottom: 30, left: 22 }

export default function KeywordGraph({ root, childrenOf, scaleToFit = true, selectedId = null, onSelectNode = null }) {
  const svgRef = useRef(null)

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    if (!root) return

    function toHierarchyNode(node) {
      return { ...node, children: childrenOf(node.id).map(toHierarchyNode) }
    }
    const hierarchyRoot = d3.hierarchy(toHierarchyNode(root))
    const leaves = hierarchyRoot.leaves()
    const maxDepth = hierarchyRoot.height

    // Reserve the deepest row as bottom margin — d3.tree() places the deepest depth exactly at
    // the far edge of its span, which would otherwise clip the last row against the SVG edge.
    const innerWidth = Math.max(240, (leaves.length - 1) * SIBLING_SPACING)
    const innerHeight = maxDepth * LEVEL_SPACING

    d3.tree().size([innerWidth, innerHeight])(hierarchyRoot)

    // When a node is selected as the test scope, the ids of it + all its descendants form the
    // "in scope" set; everything outside is dimmed so the covered subtree reads at a glance.
    const selectedNode = selectedId != null
      ? hierarchyRoot.descendants().find((d) => d.data.id === selectedId)
      : null
    const scopeIds = selectedNode ? new Set(selectedNode.descendants().map((d) => d.data.id)) : null
    const inScope = (d) => !scopeIds || scopeIds.has(d.data.id)

    const width = innerWidth + MARGIN.left + MARGIN.right
    const height = innerHeight + MARGIN.top + MARGIN.bottom

    svg.attr('viewBox', `0 0 ${width} ${height}`)
    // scaleToFit shrinks the whole drawing (nodes + text) to the panel's width — fine for small
    // hierarchies, but illegible for bushy ones. The expanded modal view sets this false so the
    // SVG renders at its natural pixel size instead, scrolling if it doesn't fit.
    if (scaleToFit) {
      svg.attr('width', '100%').attr('height', height)
    } else {
      svg.attr('width', width).attr('height', height)
    }
    const g = svg.append('g').attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`)

    // Arrowhead marker for the "directed graph" edges.
    svg.append('defs').append('marker')
      .attr('id', 'kw-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#C9CED8')

    // An edge is in scope only when its child endpoint is inside the selected subtree.
    g.selectAll('path.link')
      .data(hierarchyRoot.links())
      .join('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#E2DCDC')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#kw-arrow)')
      .attr('opacity', (d) => (inScope(d.target) ? 1 : 0.22))
      .attr('d', d3.linkVertical().x((d) => d.x).y((d) => d.y))

    const node = g.selectAll('g.node')
      .data(hierarchyRoot.descendants())
      .join('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .attr('opacity', (d) => (inScope(d) ? 1 : 0.28))

    if (onSelectNode) {
      node.style('cursor', 'pointer').on('click', (event, d) => onSelectNode(d.data))
    }

    node.append('title').text((d) => d.data.definition)

    node.append('circle')
      .attr('r', (d) => (d.depth === 0 ? 10 : 7.5))
      .attr('fill', (d) => NODE_COLORS[d.depth % NODE_COLORS.length])
      // Ring the chosen subtree root so the anchor of the selection is unmistakable.
      .attr('stroke', (d) => (selectedId != null && d.data.id === selectedId ? '#2E3A4E' : 'none'))
      .attr('stroke-width', 3)

    node.append('text')
      .attr('x', 14)
      .attr('dy', '0.32em')
      .attr('font-size', 14)
      .attr('font-weight', (d) => (d.depth === 0 || d.children ? 700 : 500))
      .attr('fill', '#2E3A4E')
      .text((d) => d.data.name)
  }, [root, childrenOf, scaleToFit, selectedId, onSelectNode])

  if (!root) {
    return <div style={{ padding: '30px 24px', textAlign: 'center', fontSize: 13, color: '#8A93A3' }}>No keywords yet.</div>
  }

  return <svg ref={svgRef} style={{ display: 'block' }} />
}
