1. Get rewards info from readsi script, write to file `rewards.json`:

    Usage for these scripts is found in this hackmd doc https://hackmd.io/@swarm-devrel/ByBpl10Ah

    ```bash
    go run main.go --since=1125h --cmd=reward --format=json > rewards.json
    ```
    I manually removed the results not from the target month here but this should probably be automated. I also made a request to Calin to add "start" and "end" flags so that the readsi script will specifically return an exact time range of values and it won't require additional cleanup.

    Copy the file into the project folder into the /readsi folder. Manually update filename in `analyze-rewards.js` file at line 5

1. Get committed events dump:
    
    ```
      curl https://api.swarmscan.io/v1/events/redistribution/committed/dump > committed-events.json
    ```
1. Run get-dumps.js script - this downloads full network dumps for each day of the month in 12 hour intervals

    ```
    node get-dumps.js
    ```

1. Run the `analyze-commit-dumps-with-locations.js` script - this returns the location data for the nodes which have issued commit transactions within the target month. 

    ```
    node analyze-commit-dumps-with-locations.js
    ```

1. Run the `analyze-rewards.js` script to get mean, median, total bzz rewarded, and total number of unique winning underlays

    ```
    node analyze-rewards.js
    ```

1. Run count-overlays.js - this returns the total number of reachable overlays for the month (this is used to represent the number of nodes online in the month, due to a variety of reasons this isn't really the most exact measure of how many nodes are around in any one month, but it's a close enough representation). This is based on the analysis of the dumps downloaded from the `get-dumps.js` script, so make sure that `get-dumps.js` has already finished running.

    ```
    node count-overlays.js
    ```
