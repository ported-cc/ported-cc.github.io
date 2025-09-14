1. findServer()
2. -> Check local storage for optimisic server
3. -> Return optimistic server
4. -> If optimistic server has priority 1 -> re-check availability in the background
5. -> If optimistic server has low priority -> re-check all servers in background
6. -> If higher priority server is found, set that as optimistic server in local storage
7. -> If background availability check fails, -> re-check all servers in background
8. -> If no optimistic server is present, use smartWait function to find the best-fit server with a quick response.
9. -> Once the optimistic server is returned and used to load in assets, continue checking the servers to see if any slower available servers (with higher priority) are available.

In this sense, once first run, we grab any server with sufficient priority to quickly load assets without having to check every server
On consecutive runs, return the actual highest priority available server