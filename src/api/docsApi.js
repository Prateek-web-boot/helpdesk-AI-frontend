import axios from "axios";

const docsApi = axios.create({
    baseURL: import.meta.env.VITE_DOCS_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export default docsApi;
