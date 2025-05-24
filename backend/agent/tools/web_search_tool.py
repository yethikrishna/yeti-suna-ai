import asyncio
import json
import datetime
import logging
import os
from urllib.parse import urlparse

import requests # For HTTP requests
from bs4 import BeautifulSoup # For HTML parsing
from duckduckgo_search import DDGS # For web search

from agentpress.tool import Tool, ToolResult, openapi_schema, xml_schema
# No longer using utils.config directly for API keys here, assuming DDGS and requests don't need special keys from config
# from utils.config import config # Keep commented or remove if not used for anything else
from sandbox.tool_base import SandboxToolsBase # Assuming this provides self.workspace_path and self.sandbox
from agentpress.thread_manager import ThreadManager


class SandboxWebSearchTool(SandboxToolsBase):
    """Tool for performing web searches using DuckDuckGo and web scraping using requests and BeautifulSoup."""

    def __init__(self, project_id: str, thread_manager: ThreadManager):
        super().__init__(project_id, thread_manager)
        # API keys for Tavily and Firecrawl are removed.
        # DDGS does not require an API key.
        # requests/BeautifulSoup do not require API keys.
        logging.info("SandboxWebSearchTool initialized with DuckDuckGo and BeautifulSoup.")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for up-to-date information on a specific topic using DuckDuckGo. This tool allows you to gather real-time information from the internet. Results include titles, URLs, and snippets of content.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query. Be specific for better results."
                    },
                    "num_results": {
                        "type": "integer",
                        "description": "The number of search results to return. Default is 10. Max is 25.",
                        "default": 10
                    }
                },
                "required": ["query"]
            }
        }
    })
    @xml_schema(
        tag_name="web-search",
        mappings=[
            {"param_name": "query", "node_type": "attribute", "path": "."},
            {"param_name": "num_results", "node_type": "attribute", "path": "."}
        ],
        example='''
        <!-- 
        The web-search tool allows you to search the internet for real-time information using DuckDuckGo.
        Use this tool when you need to find current information, research topics, or verify facts.
        
        THE TOOL RETURNS:
        - A list of search results, each including: title, URL (href), and a snippet (body).
        
        WORKFLOW RECOMMENDATION:
        1. Use web-search first with a specific question or keywords.
        2. Review the titles, URLs, and snippets to identify relevant pages.
        3. If more detailed information is needed from specific pages, use the scrape_webpage tool with those URLs.
        -->
        
        <!-- Simple search example -->
        <web-search 
            query="what is the latest news on AI?" 
            num_results="5">
        </web-search>
        
        <!-- Another search example -->
        <web-search 
            query="benefits of using Python for data science" 
            num_results="10">
        </web-search>
        '''
    )
    async def web_search(
        self, 
        query: str,
        num_results: int = 10
    ) -> ToolResult:
        """
        Search the web using DuckDuckGo to find relevant and up-to-date information.
        """
        try:
            if not query or not isinstance(query, str):
                return self.fail_response("A valid search query is required.")
            
            try:
                num_results = int(num_results) if num_results is not None else 10
            except ValueError:
                logging.warning(f"Invalid num_results value '{num_results}', defaulting to 10.")
                num_results = 10
            num_results = max(1, min(num_results, 25)) # DDGS typically returns around 25 max without pagination

            logging.info(f"Executing web search with DuckDuckGo for query: '{query}' with up to {num_results} results")
            
            # DDGS().text returns a list of dictionaries: [{'title': '...', 'href': '...', 'body': '...'}]
            # DDGS is synchronous, so run it in a thread for async compatibility
            search_results = await asyncio.to_thread(
                DDGS().text,
                keywords=query,
                max_results=num_results
            )
            
            response_output = {
                "query": query,
                "results": search_results if search_results else [],
            }
            
            logging.info(f"Retrieved {len(response_output['results'])} search results for query: '{query}'")
            
            return ToolResult(
                success=True,
                output=json.dumps(response_output, ensure_ascii=False)
            )
        
        except Exception as e:
            error_message = str(e)
            logging.error(f"Error performing web search with DuckDuckGo for '{query}': {error_message}", exc_info=True)
            simplified_message = f"Error performing web search: {error_message[:200]}"
            if len(error_message) > 200:
                simplified_message += "..."
            return self.fail_response(simplified_message)

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "scrape_webpage",
            "description": "Extract plain text content from multiple webpages using requests and BeautifulSoup. Provide URLs separated by commas. This tool is useful for getting the textual content of web pages identified via web_search. It removes common clutter like scripts, styles, navigation, and footers.",
            "parameters": {
                "type": "object",
                "properties": {
                    "urls": {
                        "type": "string",
                        "description": "One or more URLs to scrape, separated by commas. Example: 'https://example.com/page1,https://example.com/page2'"
                    }
                },
                "required": ["urls"]
            }
        }
    })
    @xml_schema(
        tag_name="scrape-webpage",
        mappings=[
            {"param_name": "urls", "node_type": "attribute", "path": "."}
        ],
        example='''
        <!-- 
        The scrape_webpage tool extracts the main textual content from specified URLs.
        Use this tool after identifying relevant pages with web_search, when you need more
        detail than the search snippets provide.
        
        WORKFLOW PRIORITY:
        1. ALWAYS use web-search first to find relevant URLs and snippets.
        2. Only use scrape_webpage for URLs where the full text is necessary.
        
        When to use scrape_webpage:
        - To get complete article text.
        - For analyzing lengthy documentation or guides.
        - When comparing detailed content across multiple sources.
        
        The tool returns plain text content, with HTML tags, scripts, and styles removed.
        Content is saved to a file in the workspace.
        -->
        
        <!-- Example workflow: -->
        <!-- 1. First search for relevant content -->
        <web-search 
            query="how to use BeautifulSoup for web scraping" 
            num_results="3">
        </web-search>
        
        <!-- 2. Then, if needed, scrape specific URLs from the search results -->
        <scrape-webpage 
            urls="https_relevant_url_from_search_1.com,https_another_url.com">
        </scrape-webpage>
        '''
    )
    async def scrape_webpage(
        self,
        urls: str
    ) -> ToolResult:
        """
        Retrieve the plain text content of multiple webpages using requests and BeautifulSoup.
        """
        try:
            logging.info(f"Starting to scrape webpages with requests+BeautifulSoup: {urls}")
            
            await self._ensure_sandbox() # Ensure sandbox is initialized for file saving
            
            if not urls:
                logging.warning("Scrape attempt with empty URLs")
                return self.fail_response("Valid URLs are required.")
            
            url_list = [url.strip() for url in urls.split(',') if url.strip()]
            
            if not url_list:
                logging.warning("No valid URLs found in the input")
                return self.fail_response("No valid URLs provided.")
                
            logging.info(f"Processing {len(url_list)} URLs: {url_list}")
            
            # Use asyncio.gather to run scraping tasks concurrently for multiple URLs
            scrape_tasks = []
            for url_str in url_list:
                # Ensure protocol is present
                current_url = url_str
                if not (current_url.startswith('http://') or current_url.startswith('https://')):
                    current_url = 'https://' + current_url
                    logging.info(f"Added https:// protocol to URL: {current_url}")
                scrape_tasks.append(self._scrape_single_url_with_requests(current_url))
            
            results = await asyncio.gather(*scrape_tasks, return_exceptions=True)
            
            # Process results, handling potential exceptions from asyncio.gather
            processed_results = []
            for i, res_or_exc in enumerate(results):
                original_url = url_list[i] # Get original URL for reporting
                if isinstance(res_or_exc, Exception):
                    logging.error(f"Exception occurred while scraping {original_url}: {res_or_exc}", exc_info=True)
                    processed_results.append({
                        "url": original_url,
                        "success": False,
                        "error": str(res_or_exc)
                    })
                else:
                    processed_results.append(res_or_exc)


            successful = sum(1 for r in processed_results if r.get("success", False))
            failed = len(processed_results) - successful
            
            message_parts = []
            if successful == len(processed_results):
                message_parts.append(f"Successfully scraped all {len(processed_results)} URLs.")
            elif successful > 0:
                message_parts.append(f"Scraped {successful} URLs successfully and {failed} failed.")
            else:
                error_details = "; ".join([f"{r.get('url')}: {r.get('error', 'Unknown error')}" for r in processed_results if not r.get('success')])
                return self.fail_response(f"Failed to scrape all {len(processed_results)} URLs. Errors: {error_details}")

            for r in processed_results:
                if r.get("success", False) and r.get("file_path"):
                    message_parts.append(f"- Scraped {r.get('url')}: Title '{r.get('title', 'N/A')}', Content Length: {r.get('content_length', 0)}, Saved to: {r.get('file_path')}")
            
            if failed > 0:
                message_parts.append("\nFailed URLs:")
                for r in processed_results:
                    if not r.get("success", False):
                        message_parts.append(f"- {r.get('url')}: {r.get('error', 'Unknown error')}")
            
            return ToolResult(
                success=True,
                output="\n".join(message_parts)
            )
        
        except Exception as e:
            error_message = str(e)
            logging.error(f"Error in scrape_webpage: {error_message}", exc_info=True)
            return self.fail_response(f"Error processing scrape request: {error_message[:200]}")

    def _http_get_and_parse_sync(self, url_to_scrape: str, timeout_seconds: int = 20) -> dict:
        """
        Synchronous helper to perform HTTP GET and parse with BeautifulSoup.
        This function will be run in a separate thread via asyncio.to_thread.
        """
        try:
            headers = { # Set a common user-agent
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(url_to_scrape, headers=headers, timeout=timeout_seconds)
            response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)

            soup = BeautifulSoup(response.content, 'html.parser')

            # Remove common clutter tags
            for tag_name in ['script', 'style', 'nav', 'footer', 'header', 'aside', 'form', 'noscript', 'link', 'meta', 'iframe', 'img', 'button', 'input']:
                for tag in soup.find_all(tag_name):
                    tag.decompose()
            
            title_tag = soup.find('title')
            title = title_tag.string.strip() if title_tag and title_tag.string else url_to_scrape

            text_content = soup.get_text(separator='\n', strip=True)
            lines = [line for line in text_content.splitlines() if line.strip()] # Remove empty lines
            cleaned_text = "\n".join(lines)

            return {
                "title": title,
                "text": cleaned_text,
                "success": True
            }
        except requests.exceptions.Timeout:
            logging.warning(f"Timeout during requests.get for {url_to_scrape}")
            return {"title": "", "text": "", "error": f"Timeout after {timeout_seconds}s", "success": False}
        except requests.exceptions.RequestException as e:
            logging.warning(f"requests.get failed for {url_to_scrape}: {str(e)}")
            return {"title": "", "text": "", "error": str(e), "success": False}
        except Exception as e: # Catch other parsing errors
            logging.error(f"Error parsing content for {url_to_scrape}: {str(e)}", exc_info=True)
            return {"title": "", "text": "", "error": f"Parsing error: {str(e)}", "success": False}

    async def _scrape_single_url_with_requests(self, url: str) -> dict:
        """
        Helper function to scrape a single URL using requests and BeautifulSoup,
        and save the result information.
        """
        logging.info(f"Scraping single URL with requests+BS4: {url}")
        
        try:
            scraped_data = await asyncio.to_thread(self._http_get_and_parse_sync, url)

            if not scraped_data.get("success"):
                return {
                    "url": url,
                    "success": False,
                    "error": scraped_data.get("error", "Scraping failed in _http_get_and_parse_sync")
                }

            title = scraped_data["title"]
            text_content = scraped_data["text"]
            logging.info(f"Extracted content from {url}: title='{title}', content length={len(text_content)}")
            
            formatted_result_for_file = { # This is what gets saved to the file
                "title": title,
                "url": url,
                "text": text_content 
            }
            
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            parsed_url = urlparse(url)
            domain = parsed_url.netloc.replace("www.", "")
            domain = "".join([c if c.isalnum() else "_" for c in domain])
            safe_filename = f"scraped_{timestamp}_{domain}.json" # Changed prefix
            
            logging.info(f"Generated filename for scraped content: {safe_filename}")
            
            scrape_dir = f"{self.workspace_path}/scrape"
            # Ensure the directory exists (create_folder should handle if it already exists)
            self.sandbox.fs.create_folder(scrape_dir, "755") 
            
            results_file_path = f"{scrape_dir}/{safe_filename}"
            json_content_to_save = json.dumps(formatted_result_for_file, ensure_ascii=False, indent=2)
            logging.info(f"Saving scraped content to file: {results_file_path}, size: {len(json_content_to_save)} bytes")
            
            await asyncio.to_thread( # Ensure file writing is also non-blocking if it could be slow
                self.sandbox.fs.upload_file,
                results_file_path, 
                json_content_to_save.encode('utf-8')
            )
            
            # This is the dictionary returned by the function, to be aggregated by scrape_webpage
            return {
                "url": url,
                "success": True,
                "title": title,
                "file_path": results_file_path,
                "content_length": len(text_content)
            }
        
        except Exception as e:
            error_message = str(e)
            logging.error(f"Error in _scrape_single_url_with_requests for '{url}': {error_message}", exc_info=True)
            return {
                "url": url,
                "success": False,
                "error": error_message
            }

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

    class MockSandboxFS: # Minimal mock for testing
        def create_folder(self, path, mode):
            logging.info(f"FS MOCK: Create folder {path} with mode {mode}")
            os.makedirs(path, exist_ok=True)
        
        def upload_file(self, path, content_bytes):
            logging.info(f"FS MOCK: Upload file {path}, size: {len(content_bytes)} bytes")
            with open(path, 'wb') as f:
                f.write(content_bytes)

    class MockSandbox:
        def __init__(self):
            self.fs = MockSandboxFS()

    async def test_tool_main():
        mock_project_id = "test_project_websearch"
        mock_thread_manager = None # Not strictly used by these methods post-refactor for basic ops

        tool = SandboxWebSearchTool(project_id=mock_project_id, thread_manager=mock_thread_manager)
        
        tool.workspace_path = "./test_suna_workspace_websearch" 
        tool.sandbox = MockSandbox()
        if not os.path.exists(tool.workspace_path):
            os.makedirs(tool.workspace_path)
        
        logging.info("\n--- Testing web_search ---")
        search_query = "Python programming language"
        search_result = await tool.web_search(query=search_query, num_results=2)
        logging.info(f"Web search for '{search_query}': Success: {search_result.success}\nOutput: {search_result.output[:500]}...\n")

        logging.info("\n--- Testing scrape_webpage ---")
        urls_to_scrape = "https://example.com" # A simple, reliable URL
        scrape_result = await tool.scrape_webpage(urls=urls_to_scrape)
        logging.info(f"Scrape for '{urls_to_scrape}': Success: {scrape_result.success}\nOutput:\n{scrape_result.output}\n")
        
        # Test with multiple URLs
        urls_to_scrape_multi = "https://example.com,https://www.iana.org/domains/reserved"
        scrape_result_multi = await tool.scrape_webpage(urls=urls_to_scrape_multi)
        logging.info(f"Scrape for '{urls_to_scrape_multi}': Success: {scrape_result_multi.success}\nOutput:\n{scrape_result_multi.output}\n")

        # Test with an invalid URL (format-wise) to see how requests handles it
        # urls_to_scrape_invalid_format = "htp://not_a_valid_schema"
        # scrape_result_invalid_format = await tool.scrape_webpage(urls=urls_to_scrape_invalid_format)
        # logging.info(f"Scrape for invalid format URL '{urls_to_scrape_invalid_format}': Success: {scrape_result_invalid_format.success}\nOutput:\n{scrape_result_invalid_format.output}\n")

        # Test with a non-existent domain
        urls_to_scrape_non_existent = "https://thissitedefinitelyshouldnotexist12345.com"
        scrape_result_non_existent = await tool.scrape_webpage(urls=urls_to_scrape_non_existent)
        logging.info(f"Scrape for non-existent URL '{urls_to_scrape_non_existent}': Success: {scrape_result_non_existent.success}\nOutput:\n{scrape_result_non_existent.output}\n")


    if __name__ == "__main__": # This structure is important for the tool
        asyncio.run(test_tool_main())