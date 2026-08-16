/** Export service for handling export API calls. */

import { apiClient } from "./api";
import { ExportRequest } from "../types/query";

export const exportService = {
  /**
   * Export query results to specified format.
   */
  async exportResults(
    databaseName: string,
    exportRequest: ExportRequest
  ): Promise<void> {
    const response = await apiClient.post(
      `/api/v1/dbs/${databaseName}/export`,
      exportRequest,
      {
        responseType: "blob",
      }
    );

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers["content-disposition"];
    let filename = `query_results.${exportRequest.format}`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename=(.+)/);
      if (filenameMatch) {
        filename = filenameMatch[1].replace(/"/g, "");
      }
    }

    // Create download link and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();

    // Cleanup
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};