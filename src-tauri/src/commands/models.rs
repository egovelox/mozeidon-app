use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct Chunk<T> {
    pub data: Vec<T>,
}

#[derive(Debug, Deserialize)]
pub struct TabsWithWindowsAndGroups {
    pub data: Vec<TabItem>,
    pub groups: Vec<GroupItem>,
    pub windows: Vec<WindowItem>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct BookmarkItem {
    pub id: String,
    pub title: String,
    pub url: String,
    pub parent: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[allow(non_snake_case)]
pub struct TabItem {
    pub id: u64,
    pub domain: String,
    pub title: String,
    pub url: String,
    pub windowId: u64,
    pub groupId: i64,
    pub pinned: bool,
    pub lastAccessed: u64,
    pub index: i64,
}

#[derive(Debug, Deserialize, Serialize)]
#[allow(non_snake_case)]
pub struct GroupItem {
    pub id: u64,
    pub windowId: u64,
    pub collapsed: bool,
    pub color: String,
    pub title: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[allow(non_snake_case)]
pub struct WindowItem {
    pub id: u64,
    pub isLastFocused: bool,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct HistoryItem {
    pub url: String,
    pub title: String,
    pub id: String,
    pub tc: u64,
    pub vc: u64,
    pub t: u64,
}

#[derive(Debug, Deserialize, Serialize)]
#[allow(non_snake_case)]
pub struct ProfileItem {
    pub profileId: String,
    pub profileName: String,
    pub profileAlias: String,
    pub profileCommandAlias: String,
    pub profileRank: i64,
    pub registeredAt: String,
}
