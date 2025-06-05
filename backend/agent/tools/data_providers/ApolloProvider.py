import os
import requests
from typing import Dict, Any, Optional, List
from utils.config import config


class ApolloProvider:
    """
    Apollo.io API provider for people and organization search.
    
    This provider enables lead generation through Apollo's comprehensive
    people and organization search capabilities.
    """
    
    def __init__(self):
        self.base_url = "https://api.apollo.io/api/v1"
        self.api_key = config.get("APOLLO_API_KEY")
        
        if not self.api_key:
            raise ValueError("APOLLO_API_KEY not found in configuration")
        
        self.endpoints = {
            "people_search": {
                "route": "/mixed_people/search",
                "method": "POST",
                "name": "People Search",
                "description": "Search for people in the Apollo database with advanced filtering options. Useful for lead generation, prospecting, and finding contacts by job title, company, location, seniority level, and more.",
                "payload": {
                    "person_titles[]": "Job titles held by people (e.g., 'marketing manager', 'sales director')",
                    "person_locations[]": "Geographic locations where people live (e.g., 'california', 'chicago', 'ireland')",
                    "person_seniorities[]": "Job seniority levels (e.g., 'director', 'senior', 'vp', 'c_suite')",
                    "organization_locations[]": "Company headquarters locations (e.g., 'texas', 'tokyo', 'spain')",
                    "q_organization_domains[]": "Company domains (e.g., 'apollo.io', 'microsoft.com')",
                    "contact_email_status[]": "Email verification status ('verified', 'unverified', 'likely_to_engage', 'unavailable')",
                    "organization_ids[]": "Apollo organization IDs to filter by specific companies",
                    "organization_num_employees_ranges[]": "Employee count ranges (e.g., '1,10', '250,500', '10000,20000')",
                    "q_keywords": "General keywords to filter results",
                    "page": "Page number (default: 1)",
                    "per_page": "Results per page (default: 25, max: 100)"
                }
            },
            "organization_search": {
                "route": "/organizations/search",
                "method": "POST", 
                "name": "Organization Search",
                "description": "Search for organizations/companies in the Apollo database. Perfect for finding target companies, researching prospects, and building account lists based on industry, size, location, and other criteria.",
                "payload": {
                    "q_organization_domains[]": "Company domains to search for (e.g., 'apollo.io', 'salesforce.com')",
                    "organization_locations[]": "Company headquarters locations (e.g., 'san francisco', 'new york', 'london')",
                    "organization_num_employees_ranges[]": "Employee count ranges (e.g., '1,10', '11,50', '51,200', '201,500', '501,1000', '1001,5000', '5001,10000', '10001+')",
                    "organization_industry_tag_ids[]": "Industry tag IDs for filtering by specific industries",
                    "organization_keyword_tags[]": "Keyword tags associated with organizations",
                    "q_keywords": "General search keywords for company names, descriptions, etc.",
                    "sort_by_field": "Field to sort by ('organization_created_at', 'organization_num_employees')",
                    "sort_ascending": "Sort in ascending order (true/false, default: false)",
                    "page": "Page number (default: 1)",
                    "per_page": "Results per page (default: 25, max: 100)"
                }
            }
        }
    
    def get_endpoints(self) -> Dict[str, Dict[str, Any]]:
        """Get available endpoints for this provider."""
        return self.endpoints
    
    def call_endpoint(self, route: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Call an Apollo API endpoint with the given parameters.
        
        Args:
            route: The endpoint route key ('people_search' or 'organization_search')
            payload: Query parameters and filters for the API call
            
        Returns:
            dict: The JSON response from the Apollo API
            
        Raises:
            ValueError: If the endpoint route is not found
            requests.RequestException: If the API call fails
        """
        if route not in self.endpoints:
            raise ValueError(f"Endpoint '{route}' not found. Available endpoints: {list(self.endpoints.keys())}")
        
        endpoint = self.endpoints[route]
        url = f"{self.base_url}{endpoint['route']}"
        
        headers = {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
        }
        
        # Prepare the request payload
        request_data = {"api_key": self.api_key}
        
        if payload:
            # Handle array parameters for Apollo API
            for key, value in payload.items():
                if key.endswith("[]") and isinstance(value, str):
                    # Convert comma-separated strings to arrays for Apollo API
                    request_data[key] = [v.strip() for v in value.split(",") if v.strip()]
                elif key.endswith("[]") and isinstance(value, list):
                    request_data[key] = value
                else:
                    request_data[key] = value
        
        # Set default pagination if not provided
        if "page" not in request_data:
            request_data["page"] = 1
        if "per_page" not in request_data:
            request_data["per_page"] = 25
        
        try:
            response = requests.post(url, json=request_data, headers=headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise requests.RequestException(f"Apollo API call failed: {str(e)}")
    
    def search_people(
        self, 
        person_titles: Optional[List[str]] = None,
        person_locations: Optional[List[str]] = None,
        person_seniorities: Optional[List[str]] = None,
        organization_locations: Optional[List[str]] = None,
        organization_domains: Optional[List[str]] = None,
        contact_email_status: Optional[List[str]] = None,
        organization_ids: Optional[List[str]] = None,
        employee_ranges: Optional[List[str]] = None,
        keywords: Optional[str] = None,
        page: int = 1,
        per_page: int = 25
    ) -> Dict[str, Any]:
        """
        Convenience method for people search with typed parameters.
        
        Args:
            person_titles: Job titles to search for
            person_locations: Personal locations to filter by
            person_seniorities: Seniority levels to filter by
            organization_locations: Company headquarters locations
            organization_domains: Company domains
            contact_email_status: Email verification statuses
            organization_ids: Specific Apollo organization IDs
            employee_ranges: Company size ranges (e.g., ['1,10', '11,50'])
            keywords: General search keywords
            page: Page number
            per_page: Results per page
            
        Returns:
            dict: Apollo API response with people search results
        """
        payload = {
            "page": page,
            "per_page": min(per_page, 100)  # Apollo max is 100
        }
        
        if person_titles:
            payload["person_titles[]"] = person_titles
        if person_locations:
            payload["person_locations[]"] = person_locations
        if person_seniorities:
            payload["person_seniorities[]"] = person_seniorities
        if organization_locations:
            payload["organization_locations[]"] = organization_locations
        if organization_domains:
            payload["q_organization_domains[]"] = organization_domains
        if contact_email_status:
            payload["contact_email_status[]"] = contact_email_status
        if organization_ids:
            payload["organization_ids[]"] = organization_ids
        if employee_ranges:
            payload["organization_num_employees_ranges[]"] = employee_ranges
        if keywords:
            payload["q_keywords"] = keywords
            
        return self.call_endpoint("people_search", payload)
    
    def search_organizations(
        self,
        organization_domains: Optional[List[str]] = None,
        organization_locations: Optional[List[str]] = None,
        employee_ranges: Optional[List[str]] = None,
        industry_tag_ids: Optional[List[str]] = None,
        keyword_tags: Optional[List[str]] = None,
        keywords: Optional[str] = None,
        sort_by_field: Optional[str] = None,
        sort_ascending: bool = False,
        page: int = 1,
        per_page: int = 25
    ) -> Dict[str, Any]:
        """
        Convenience method for organization search with typed parameters.
        
        Args:
            organization_domains: Company domains to search
            organization_locations: Company headquarters locations
            employee_ranges: Employee count ranges
            industry_tag_ids: Industry tag IDs
            keyword_tags: Keyword tags
            keywords: General search keywords
            sort_by_field: Field to sort results by
            sort_ascending: Sort in ascending order
            page: Page number
            per_page: Results per page
            
        Returns:
            dict: Apollo API response with organization search results
        """
        payload = {
            "page": page,
            "per_page": min(per_page, 100),  # Apollo max is 100
            "sort_ascending": sort_ascending
        }
        
        if organization_domains:
            payload["q_organization_domains[]"] = organization_domains
        if organization_locations:
            payload["organization_locations[]"] = organization_locations
        if employee_ranges:
            payload["organization_num_employees_ranges[]"] = employee_ranges
        if industry_tag_ids:
            payload["organization_industry_tag_ids[]"] = industry_tag_ids
        if keyword_tags:
            payload["organization_keyword_tags[]"] = keyword_tags
        if keywords:
            payload["q_keywords"] = keywords
        if sort_by_field:
            payload["sort_by_field"] = sort_by_field
            
        return self.call_endpoint("organization_search", payload)


if __name__ == "__main__":
    """Test the Apollo provider"""
    from dotenv import load_dotenv
    load_dotenv()
    
    try:
        provider = ApolloProvider()
        
        # Test people search
        print("Testing people search...")
        people_result = provider.search_people(
            person_titles=["software engineer", "developer"],
            organization_locations=["san francisco"],
            per_page=5
        )
        print(f"Found {people_result.get('pagination', {}).get('total_entries', 0)} people")
        
        # Test organization search
        print("\nTesting organization search...")
        org_result = provider.search_organizations(
            organization_locations=["san francisco"],
            employee_ranges=["51,200"],
            per_page=5
        )
        print(f"Found {org_result.get('pagination', {}).get('total_entries', 0)} organizations")
        
    except Exception as e:
        print(f"Test failed: {e}") 