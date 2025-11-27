// 获取 API 基础地址
// 优先使用环境变量，否则在 H5 环境下使用相对路径（自动使用当前域名）
function getApiBaseUrl() {
  // 如果配置了环境变量，使用环境变量
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // 在 H5 环境下，直接使用相对路径（自动使用当前域名）
  // 这样在构建时就能确定，不需要运行时检测
  // #ifdef H5
  return ''; // 相对路径，自动使用当前域名
  // #endif
  
  // 默认值（开发环境或其他平台）
  return "https://api.app.yxbug.cn";
}

// 获取完整的 API 地址
const baseUrl = getApiBaseUrl();
export const APP_API = baseUrl ? (baseUrl + "/api") : "/api"

export const Post = (url, param, host) => {
	return Request(url, "POST", param, host)
}

export const Get = (url, param, host) => {
	return Request(url, "GET", param, host)
}

export const Request = (url, method, param, host) => {
	return new Promise(async (cback, reject) => {
		uni.request({
			url: host + url,
			data: param,
			method: method,
			header: {},
		}).then(async response => {
			const status = response.statusCode.toString();
			const result = response.data

			if (status.charAt(0) === '2') {
				cback(result.data);
			} else {
				const msg = result.msg ? result.msg : '网络请求异常!'
				uni.$u.toast(msg)
				reject(result)
			}
		}).catch(err => {
			reject(err)
		})
	})
}
