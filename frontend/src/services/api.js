const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMsg = data.detail || data.message || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }
    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  getHealth: () => request('/api/health'),
  loginForFileAccess: (password) =>
    request('/api/auth/file-access', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  getFileContentUrl: (path) =>
    `${BASE_URL}/api/files/content?path=${encodeURIComponent(path)}`,
  getConfig: () => request('/api/config'),
  updateConfig: (allowed_root, current_scan_dir) =>
    request('/api/config', {
      method: 'POST',
      body: JSON.stringify({ allowed_root, current_scan_dir }),
    }),
  getCategories: () => request('/api/categories'),
  scanFiles: (directory) => {
    const param = directory ? `?directory=${encodeURIComponent(directory)}` : '';
    return request(`/api/scan${param}`);
  },
  getStatistics: (directory) => {
    const param = directory ? `?directory=${encodeURIComponent(directory)}` : '';
    return request(`/api/statistics${param}`);
  },
  previewOrganize: (directory) => {
    const param = directory ? `?directory=${encodeURIComponent(directory)}` : '';
    return request(`/api/organize/preview${param}`);
  },
  executeOrganize: (target_dir, file_paths = null) =>
    request('/api/organize/execute', {
      method: 'POST',
      body: JSON.stringify({
        target_dir,
        file_paths,
        confirmed: true,
      }),
    }),
  getDuplicates: (directory) => {
    const param = directory ? `?directory=${encodeURIComponent(directory)}` : '';
    return request(`/api/duplicates${param}`);
  },
  searchFiles: (query = '', category = null, extension = null, directory = null) => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (category && category !== 'All') params.append('category', category);
    if (extension) params.append('extension', extension);
    if (directory) params.append('directory', directory);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/search${qs}`);
  },
  getHistory: (limit = 20) => request(`/api/history?limit=${limit}`),
  undoOperation: (batch_id = null) =>
    request('/api/history/undo', {
      method: 'POST',
      body: JSON.stringify({ batch_id }),
    }),
  uploadFiles: (files, autoOrganize = true, directory = null) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    const params = new URLSearchParams();
    params.append('auto_organize', autoOrganize);
    if (directory) params.append('directory', directory);

    return fetch(`${BASE_URL}/api/upload?${params.toString()}`, {
      method: 'POST',
      body: formData,
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Upload failed');
      }
      return data;
    });
  },
  seedSampleData: () =>
    request('/api/sample-data/seed', {
      method: 'POST',
    }),
};
