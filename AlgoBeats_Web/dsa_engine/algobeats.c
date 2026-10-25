#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define MAX_SONGS 10
#define MAX_TITLE 80
#define MAX_ARTIST 60
#define MAX_LINE 512

typedef struct {
    int id;
    char title[MAX_TITLE];
    char artist[MAX_ARTIST];
    int duration;
    int popularity;
    char audio[180];
} Song;


static Song songs[MAX_SONGS] = {
    {1, "Slow Motion", "Atlas Audio", 213, 92, "assets/audio/atlasaudio-slow-motion-589995.mp3"},
    {2, "Ocean Coffee", "Audio Coffee", 196, 87, "assets/audio/audiocoffee-ocean-245607.mp3"},
    {3, "Midnight Drive", "Bransboynd", 228, 88, "assets/audio/bransboynd-midnight-drive-392527.mp3"},
    {4, "Golden Hour Haze", "Elijah K", 205, 79, "assets/audio/elijah_k-golden-hour-haze-320837.mp3"},
    {5, "Paper Sunroom", "Lofcosmos", 241, 73, "assets/audio/lofcosmos-paper-sunroom-611022.mp3"},
    {6, "Velvet Sins", "Lucy O Sne", 222, 85, "assets/audio/lucy_o_sne-velvet-sins-431060.mp3"},
    {7, "Afterglow", "SoulProdMusic", 235, 69, "assets/audio/soulprodmusic-afterglow-623066.mp3"},
    {8, "Golden Hour", "Paper Skies", 196, 87, "assets/audio/elijah_k-golden-hour-haze-320837.mp3"},
    {9, "Ocean Lights", "Blue Avenue", 228, 83, "assets/audio/audiocoffee-ocean-245607.mp3"},
    {10, "Last Train Home", "Northbound", 235, 57, "assets/audio/bransboynd-midnight-drive-392527.mp3"}
};


static int linear_search(int id, int *comparisons) {
    *comparisons = 0;
    for (int i = 0; i < MAX_SONGS; ++i) {
        ++*comparisons;
        if (songs[i].id == id) return i;
    }
    return -1;
}
static int binary_search_id(int id, int *comparisons) {
    int ids[MAX_SONGS];
    for (int i = 0; i < MAX_SONGS; ++i) ids[i] = songs[i].id;
    int lo = 0, hi = MAX_SONGS - 1;
    *comparisons = 0;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        ++*comparisons;
        if (ids[mid] == id) return mid;
        if (ids[mid] < id) lo = mid + 1; else hi = mid - 1;
    }
    return -1;
}
static void merge(Song a[], Song tmp[], int left, int mid, int right, long *ops) {
    int i = left, j = mid + 1, k = left;
    while (i <= mid && j <= right) {
        ++*ops;
        if (strcmp(a[i].title, a[j].title) <= 0) tmp[k++] = a[i++];
        else tmp[k++] = a[j++];
    }
    while (i <= mid) tmp[k++] = a[i++];
    while (j <= right) tmp[k++] = a[j++];
    for (i = left; i <= right; ++i) a[i] = tmp[i];
}
static void merge_sort_rec(Song a[], Song tmp[], int l, int r, long *ops) {
    if (l >= r) return;
    int m = l + (r - l) / 2;
    merge_sort_rec(a, tmp, l, m, ops);
    merge_sort_rec(a, tmp, m + 1, r, ops);
    merge(a, tmp, l, m, r, ops);
}
static void merge_sort(Song a[], long *ops) {
    Song tmp[MAX_SONGS]; *ops = 0;
    merge_sort_rec(a, tmp, 0, MAX_SONGS - 1, ops);
}
static void quick_sort_rec(Song a[], int low, int high, long *ops) {
    if (low >= high) return;
    int pivot = a[high].popularity, i = low - 1;
    for (int j = low; j < high; ++j) {
        ++*ops;
        if (a[j].popularity > pivot) {
            ++i; Song t = a[i]; a[i] = a[j]; a[j] = t;
        }
    }
    Song t = a[i + 1]; a[i + 1] = a[high]; a[high] = t;
    int p = i + 1;
    quick_sort_rec(a, low, p - 1, ops);
    quick_sort_rec(a, p + 1, high, ops);
}
static void quick_sort(Song a[], long *ops) {
    *ops = 0; quick_sort_rec(a, 0, MAX_SONGS - 1, ops);
}
static void print_json_string(const char *s) {
    putchar('"');
    for (; *s; ++s) {
        if (*s == '"' || *s == '\\') putchar('\\');
        if ((unsigned char)*s >= 32) putchar(*s);
    }
    putchar('"');
}
static void print_song(const Song *s, int comma) {
    printf("{\"id\":%d,\"title\":", s->id); print_json_string(s->title);
    printf(",\"artist\":"); print_json_string(s->artist);
    printf(",\"duration\":%d,\"popularity\":%d,\"audio\":", s->duration, s->popularity);
    print_json_string(s->audio); printf("}%s", comma ? "," : "");
}
static void print_catalog(void) {
    printf("{\"ok\":true,\"songs\":[");
    for (int i = 0; i < MAX_SONGS; ++i) { print_song(&songs[i], i + 1 < MAX_SONGS); }
    printf("]}\n");
}
static void print_results(const char *kind, Song a[], long ops) {
    printf("{\"ok\":true,\"operation\":"); print_json_string(kind);
    printf(",\"operations\":%ld,\"songs\":[", ops);
    for (int i = 0; i < MAX_SONGS; ++i) { print_song(&a[i], i + 1 < MAX_SONGS); }
    printf("]}\n");
}
static void print_search(int id, int is_binary) {
    int c = 0, idx = is_binary ? binary_search_id(id, &c) : linear_search(id, &c);
    printf("{\"ok\":true,\"algorithm\":");
    print_json_string(is_binary ? "Binary Search" : "Linear Search");
    printf(",\"comparisons\":%d,\"found\":%s,\"song\":", c, idx >= 0 ? "true" : "false");
    if (idx >= 0) print_song(&songs[idx], 0); else printf("null");
    printf("}\n");
}
int main(void) {
    char line[MAX_LINE];
    if (!fgets(line, sizeof line, stdin)) return 0;
    char op[40] = {0}; int id = 0;
    if (sscanf(line, "%39s", op) != 1) { puts("{\"ok\":false,\"error\":\"Missing operation\"}"); return 0; }
    if (!strcmp(op, "catalog")) { print_catalog(); return 0; }
    if (!strcmp(op, "linear_search") || !strcmp(op, "binary_search")) {
        if (sscanf(line, "%*s %d", &id) != 1) { puts("{\"ok\":false,\"error\":\"Provide a numeric song ID\"}"); return 0; }
        print_search(id, !strcmp(op, "binary_search")); return 0;
    }
    if (!strcmp(op, "merge_sort") || !strcmp(op, "quick_sort")) {
        Song copy[MAX_SONGS]; memcpy(copy, songs, sizeof songs); long ops = 0;
        if (!strcmp(op, "merge_sort")) { merge_sort(copy, &ops); print_results("Merge Sort by title", copy, ops); }
        else { quick_sort(copy, &ops); print_results("Quick Sort by popularity", copy, ops); }
        return 0;
    }
    puts("{\"ok\":false,\"error\":\"Unknown operation\"}");
    return 0;
}
