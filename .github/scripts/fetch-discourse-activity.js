// .github/scripts/fetch-discourse-activity.js
// Fixed for ES modules

import fetch from 'node-fetch';
import fs from 'fs';

const DISCOURSE_URL = 'https://forums.powershell.org';

async function fetchDiscourseActivity() {
    try {
        const activities = [];
        
        // 1. Get latest topics
        console.log('Fetching latest topics...');
        const topicsResponse = await fetch(`${DISCOURSE_URL}/latest.json`);
        const topicsData = await topicsResponse.json();
        
        // Get 2 most recent topics
        if (topicsData.topic_list && topicsData.topic_list.topics) {
            topicsData.topic_list.topics.slice(0, 2).forEach(topic => {
                activities.push({
                    message: topic.title.length > 50 ? topic.title.substring(0, 50) + '...' : topic.title,
                    time: getRelativeTime(topic.created_at),
                    type: 'topic',
                    color: 'bg-blue-500',
                    url: `${DISCOURSE_URL}/t/${topic.slug}/${topic.id}`
                });
            });
        }
        
        // 2. Get site statistics
        console.log('Fetching site statistics...');
        const statsResponse = await fetch(`${DISCOURSE_URL}/site/statistics.json`);
        const statsData = await statsResponse.json();
        
        // Add a stats-based activity
        activities.push({
            message: `${statsData.topics_7_days || 0} new topics this week`,
            time: 'This week',
            type: 'stats',
            color: 'bg-green-500'
        });
        
        // 3. Try to get recent posts (may not be available publicly)
        try {
            console.log('Trying to fetch recent posts...');
            const postsResponse = await fetch(`${DISCOURSE_URL}/posts.json`);
            if (postsResponse.ok) {
                const postsData = await postsResponse.json();
                
                if (postsData.latest_posts && postsData.latest_posts.length > 0) {
                    const recentPost = postsData.latest_posts[0];
                    activities.push({
                        message: `New reply in "${recentPost.topic_title ? recentPost.topic_title.substring(0, 40) + '...' : 'discussion'}"`,
                        time: getRelativeTime(recentPost.created_at),
                        type: 'reply',
                        color: 'bg-purple-500'
                    });
                }
            }
        } catch (error) {
            console.log('Posts endpoint not available publicly, skipping...');
        }
        
        // 4. Create community stats object
        const communityStats = {
            activities: activities.slice(0, 4), // Limit to 4 items
            stats: {
                total_topics: statsData.topics_count || 0,
                total_posts: statsData.posts_count || 0,
                active_users: statsData.users_count || 0,
                topics_this_week: statsData.topics_7_days || 0
            },
            last_updated: new Date().toISOString()
        };
        
        // Ensure data directory exists
        if (!fs.existsSync('./data')) {
            fs.mkdirSync('./data', { recursive: true });
        }
        
        // Save to Hugo data file
        fs.writeFileSync('./data/community_stats.json', JSON.stringify(communityStats, null, 2));
        
        console.log('✅ Discourse activity fetched successfully');
        console.log(`📊 Found ${activities.length} activities`);
        console.log(`👥 ${communityStats.stats.active_users} total users`);
        console.log(`📝 ${communityStats.stats.topics_this_week} topics this week`);
        
    } catch (error) {
        console.error('❌ Error fetching Discourse data:', error);
        
        // Fallback to static data if API fails
        const fallbackData = {
            activities: [
                {
                    message: "PowerShell 7.4.1 released with security updates",
                    time: "Last week",
                    type: "release",
                    color: "bg-green-500"
                },
                {
                    message: "New Azure PowerShell module available",
                    time: "2 weeks ago",
                    type: "update", 
                    color: "bg-blue-500"
                },
                {
                    message: "Community module spotlight: PSWriteHTML",
                    time: "3 weeks ago",
                    type: "community",
                    color: "bg-purple-500"
                },
                {
                    message: "PowerShell Gallery security improvements",
                    time: "1 month ago",
                    type: "security",
                    color: "bg-orange-500"
                }
            ],
            stats: {
                total_topics: 15420,
                total_posts: 85230,
                active_users: 12500,
                topics_this_week: 45
            },
            last_updated: new Date().toISOString(),
            fallback: true
        };
        
        // Ensure data directory exists
        if (!fs.existsSync('./data')) {
            fs.mkdirSync('./data', { recursive: true });
        }
        
        fs.writeFileSync('./data/community_stats.json', JSON.stringify(fallbackData, null, 2));
        console.log('📝 Using fallback data due to API error');
    }
}

function getRelativeTime(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) return 'Last week';
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    return 'Last month';
}

// Run the function
fetchDiscourseActivity();