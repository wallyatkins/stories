export function uploadWithProgress({ url, formData, method = 'POST', onProgress, headers = {}, withCredentials = false }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.responseType = 'text';
    xhr.withCredentials = withCredentials;

    Object.entries(headers).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        xhr.setRequestHeader(key, value);
      }
    });

    const startTime = Date.now();

    xhr.upload.onprogress = (event) => {
      if (!onProgress) return;
      const elapsedSeconds = Math.max((Date.now() - startTime) / 1000, 0.001);
      const bytesPerSecond = event.loaded / elapsedSeconds;
      const percent = event.lengthComputable && event.total > 0
        ? Math.min(100, Math.round((event.loaded / event.total) * 1000) / 10)
        : null;

      onProgress({
        loaded: event.loaded,
        total: event.lengthComputable ? event.total : null,
        percent,
        bytesPerSecond,
      });
    };

    xhr.onerror = () => {
      reject(new Error('Upload failed due to a network error.'));
    };

    xhr.onload = () => {
      const contentType = xhr.getResponseHeader('Content-Type') || '';
      let body = xhr.responseText;
      if (contentType.includes('application/json')) {
        try {
          body = JSON.parse(xhr.responseText || '{}');
        } catch (error) {
          reject(new Error('Upload completed but response could not be parsed.'));
          return;
        }
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ status: xhr.status, body });
      } else {
        reject(new Error(body?.error || `Upload failed with status ${xhr.status}.`));
      }
    };

    try {
      xhr.send(formData);
    } catch (error) {
      reject(error);
    }
  });
}

