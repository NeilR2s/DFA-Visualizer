# TODO: complete this class

class PaginationHelper:
    
    # The constructor takes in an array of items and an integer indicating
    # how many items fit within a single page
    def __init__(self, collection, items_per_page):
        self.collection = collection
        self.len_collection = len(collection)
        self.items_per_page = items_per_page

    
    # returns the number of items within the entire collection
    def item_count(self):
        return self.len_collection
    
    # returns the number of pages
    def page_count(self):
        raw_div_result = self.len_collection//self.items_per_page
        mod_result = self.len_collection%self.items_per_page 
        page_count = raw_div_result if mod_result == 0 else raw_div_result+1 
        # self.page_count = page_count
        return page_count
    
    # returns the number of items on the given page. page_index is zero based
    # this method should return -1 for page_index values that are out of range
    def page_item_count(self, page_index):
        
        if page_index < 0 or page_index >= self.page_count():
            result = -1
        elif page_index ==  (self.page_count()-1):
            result = (self.page_count()*self.items_per_page-self.len_collection)
        else:
            result = self.items_per_page

        return result
    
    # determines what page an item at the given index is on. Zero based indexes.
    # this method should return -1 for item_index values that are out of range
    def page_index(self, item_index):
        if item_index > self.len_collection or item_index < 0:
            page_index = -1
        else:
            page_index = item_index//self.items_per_page
        return page_index

helper = PaginationHelper(['a','b','c','d','e','f'], 4)
print(helper.page_count()) # should == 2
print(helper.item_count()) # should == 6
print(helper.page_item_count(0)) # should == 4
print(helper.page_item_count(1)) # last page - should == 2
print(helper.page_item_count(2)) # should == -1 since the page is invalid

# page_index takes an item index and returns the page that it belongs on
print(helper.page_index(5)) # should == 1 (zero based index)
print(helper.page_index(2)) # should == 0
print(helper.page_index(20)) # should == -1
print(helper.page_index(-10)) # should == -1 because negative indexes are invalid