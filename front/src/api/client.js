const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

async function request(path, { method = 'GET', body, token, query } = {}) {
  const url = new URL(BASE + path)
  if (token) url.searchParams.set('token', token)
  if (query) {
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value)
  }

  const options = { method }
  if (body instanceof FormData) {
    // Let the browser set Content-Type (with the multipart boundary).
    options.body = body
  } else if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const detail = data?.detail
    const error = new Error(typeof detail === 'string' ? detail : `Request failed (${response.status})`)
    error.status = response.status
    throw error
  }
  return data
}

export function login(email, password) {
  return request('/login', { method: 'POST', body: { email, password } })
}

export function register({ email, password, name, lastname, role }) {
  return request('/register', { method: 'POST', body: { email, password, name, lastname, role } })
}

export function logout(token) {
  return request('/logout', { method: 'POST', token })
}

export function getCourses(token) {
  return request('/courses', { token })
}

export function createCourse(name, token) {
  return request('/courses', { method: 'POST', token, query: { name } })
}

export function deleteCourse(courseId, token) {
  return request(`/courses/${courseId}`, { method: 'DELETE', token })
}

export function createStudent(payload, token) {
  return request('/students', { method: 'POST', token, body: payload })
}

export function getStudents(token) {
  return request('/students', { token })
}

export function getCourse(courseId, token) {
  return request(`/courses/${courseId}`, { token })
}

export async function getMaterials(courseId, token) {
  try {
    return await request(`/courses/${courseId}/materials`, { token })
  } catch (err) {
    if (err.status === 404) return []
    throw err
  }
}

export function uploadMaterial(courseId, file, token) {
  const form = new FormData()
  form.append('file', file)
  return request(`/courses/${courseId}/upload-material`, { method: 'POST', token, body: form })
}

export function getHierarchyKeywords(hierarchyId, token) {
  return request(`/hierarchy/${hierarchyId}/keywords`, { token })
}

export function updateKeyword(keywordId, { name, definition }, token) {
  return request(`/keywords/${keywordId}`, { method: 'PUT', token, body: { name, definition } })
}

export function createTest(courseId, payload, token) {
  return request(`/courses/${courseId}/tests`, { method: 'POST', token, body: payload })
}

export function getCourseTests(courseId, token) {
  return request(`/courses/${courseId}/tests`, { token })
}

export function getTest(testId, token) {
  return request(`/tests/${testId}`, { token })
}

export function getAttemptResult(attemptId, token) {
  return request(`/attempts/${attemptId}/result`, { token })
}

export function submitTest(testId, answers, token) {
  return request(`/tests/${testId}/submit`, { method: 'POST', token, body: { answers } })
}

export function getTestAttempts(testId, token) {
  return request(`/tests/${testId}/attempts`, { token })
}

export function getTestStats(testId, token) {
  return request(`/tests/${testId}/stats`, { token })
}

export function overrideGrade(attemptId, answerId, { is_correct, feedback }, token) {
  return request(`/attempts/${attemptId}/answers/${answerId}/grade`, { method: 'PATCH', token, body: { is_correct, feedback } })
}

export function deleteTest(testId, token) {
  return request(`/tests/${testId}`, { method: 'DELETE', token })
}
