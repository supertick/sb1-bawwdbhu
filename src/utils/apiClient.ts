import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { enqueueSnackbar } from 'notistack';

const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred';

interface ApiError {
  message: string;
  details?: unknown;
  status?: number;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = (error.response.data as any)?.message || error.message;
      const details = error.response.data;

      return {
        message: this.getErrorMessage(status, message),
        details,
        status,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        message: 'Unable to reach the server. Please check your connection.',
        details: error.request,
      };
    } else {
      // Error in request setup
      return {
        message: error.message || DEFAULT_ERROR_MESSAGE,
        details: error.config,
      };
    }
  }

  private getErrorMessage(status: number, message: string): string {
    switch (status) {
      case 400:
        return 'Invalid request: ' + message;
      case 401:
        return 'Authentication required';
      case 403:
        return 'Access denied';
      case 404:
        return 'Resource not found';
      case 422:
        return 'Validation error: ' + message;
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return message || DEFAULT_ERROR_MESSAGE;
    }
  }

  private showError(error: ApiError) {
    enqueueSnackbar(error.message, {
      variant: 'error',
      autoHideDuration: 5000,
      action: (key) => {
        const button = document.createElement('button');
        button.textContent = 'View Details';
        button.className = 'text-white underline';
        button.onclick = () => {
          console.error('API Error Details:', error.details);
          alert(JSON.stringify(error.details, null, 2));
        };
        return button;
      },
    });
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios({
        baseURL: this.baseURL,
        ...config,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
      });
      return response.data;
    } catch (error) {
      const apiError = this.handleError(error as AxiosError);
      this.showError(apiError);
      throw apiError;
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  setBaseURL(url: string) {
    this.baseURL = url;
  }
}

export const apiClient = new ApiClient();