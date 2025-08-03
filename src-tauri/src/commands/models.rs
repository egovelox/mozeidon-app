use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct Chunk<T> {
    pub data: Vec<T>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct BookmarkItem {
    pub url: String,
    pub title: String,
    pub id: String,
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
