###################################
# This file uses Frameio's asset_scraper.py example from 
# https://github.com/Frameio/python-frameio-client/blob/556b835503fca776fdb2dceda3ee6d76f2f1121f/examples/assets/asset_scraper.py

# This scraper shows you how to gather assets from
# a Frame.io account and write to a CSV.
# Assets are gathered recursively from each
# team's projects.  Folders, files and version stacks are written to the CSV.
# Note: Debug statements are left in the file and commented out.
###################################

import os
from typing import Dict, List
from dotenv import load_dotenv
from frameioclient import FrameioClient

# Helper Functions to scrape teams and retrieve all assets
def get_teams_from_account(client: FrameioClient) -> Dict:
    """
    Builds a list of teams for the account.  Note: the API offers two strategies to fetch an account's teams,
    `'get_teams`` and `get_all_teams`.  Using `get_teams`, we'll pull only the teams owned by the account_id,
    disregarding teams the user belongs to but does not own.  More info: https://docs.frame.io/docs/directory-lists-and-file-trees#2-fetch-the-accounts-teams
    """
    acct = client.users.get_me()
    acct_id = acct["account_id"]
    team_name_kv = dict()
    for team in client.teams.list(acct_id):
        team_name_kv[team["id"]] = team["name"]
    return team_name_kv


def get_projects_from_team(
    client: FrameioClient, team_id: str, team_name: str
) -> List[Dict]:
    """Returns a list of projects for a team."""
    projects_in_team = []
    data = client.teams.list_projects(team_id)

    for proj in data:
        # Add project_name and team_name to the dict
        proj["project_name"] = proj.get("name")
        proj["team_name"] = team_name
        print(f"Debug: Found project: {proj['project_name']}")
        projects_in_team.append(proj)
        print(f"Debug: projects in team now: {len(projects_in_team)}")

    return projects_in_team


def get_projects_from_account(client) -> List[Dict]:
    """Gets projects from all teams in the account."""
    projects_in_account = []
    teams = get_teams_from_account(client)

    for team_id, team_name in teams.items():
        print(f"Debug: === Found team: {team_name} ===")
        projects_in_team = get_projects_from_team(client, team_id, team_name)
        projects_in_account.extend(projects_in_team)
        print(f"Debug: projects in account now: {len(projects_in_account)}")

    return projects_in_account


def scrape_asset_data_from_projects(
    client: FrameioClient, projects: List[Dict]
) -> List[Dict]:
    """
    Scrapes the asset data for an authenticated client and provided list of projects.
    Returns a list of asset metadata for all assets contained in the project.
    """
    assets_in_projects = []
    for project in projects:
        print(f"Debug: Scanning project: {project['name']} for assets")
        assets_in_project = []
        proj_root_asset_id = project.get("root_asset_id")
        assets_in_project = scrape_asset_data(
            client,
            proj_root_asset_id,
            assets_in_project,
            project["name"],
        )
        assets_in_projects.extend(assets_in_project)
        print(
            "Debug: total assets collected from projects: {}".format(
                len(assets_in_projects)
            )
        )

    return assets_in_projects


def scrape_asset_data(
    client: FrameioClient,
    asset_id: str,
    asset_list: List[Dict],
    project_name: str,
) -> List[Dict]:
    """
    Takes an initialized client and an asset_id representing a position in a directory tree.
    Recursively builds a list of assets within the tree.  Returns a list of dicts.
    """
    assets = client.assets.get_children(asset_id)

    for asset in assets:
        # Recurse through folders but skip the empty ones
        if asset["type"] == "folder" and asset != []:
            # Include non-empty folders in the list of scraped assets
            asset_list.append(asset)
            scrape_asset_data(client, asset["id"], asset_list, project_name)

        if asset["type"] == "file":
            asset_list.append(asset)

        if asset["type"] == "version_stack":
            # Read about version stacks: https://docs.frame.io/docs/managing-version-stacks
            versions = client.assets.get_children(asset["id"])
            asset_list.append(asset)
            for v_asset in versions:
                asset_list.append(v_asset)

        asset["project_name"] = project_name
        asset["team_name"] = get_teams_from_account(client)[asset["team_id"]]

    return asset_list