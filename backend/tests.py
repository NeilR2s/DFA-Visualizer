from app import bets_dfa, stars_dfa 
import unittest


class TestDFAs(unittest.TestCase):

    def test_stars_dfa(self):
        # (111 + 101 + 001 + 010) (1 + 0 + 11) (1 + 0 + 11)* (111 + 000) (111 + 000)* (01 + 10 + 00)
            test_cases_stars = [
                ("111111101", True),    
                ("010000010", True),
                ("10111011100", True),      
                ("001011100000001", True),  
                ("1111110100011100", True), 
                ("111011111100000", True), 
                ("0101111100010", True),    
                ("1111011101", True),    
                ("10100000000000000001", True), 

                # rejects >>
                ("000111101", False),     
                ("11110101001", False),    
                ("111111111", False),       
                ("111", False),            
                ("", False),              
                ("1111a11101", False),     
                ("1111111", False),        
            ]

    for input_string, expected in test_cases_stars:
        with self.subTest(input_string=input_string, expected=expected):
            result = stars_dfa.simulate(input_string)
            self.assertEqual(result['accepted'], expected, f"Input: {input_string}, Output: {result}, Expected: {expected}")

    def test_bets_dfa(self):
        # (aa + bb + aba + ba) (aba + bab + bbb) (a + b)* (a + b + aa + abab) (aa + bb)*
        test_cases_bets = [
            ("aaababaabb", True),       
            ("aaabaa", True),      
            ("bbbbba", True),         
            ("abaababaa", True),    
            ("aaabab", True),           
            ("aaabaaa", True),       
            ("ababbbaabbaab", True),   
            ("baabaabab", True),      
            ("babbbaabbaa", True),
            ("bbababb", True),      

        # rejects >>
            ("baaababaabb", False),     
            ("ababaa", False),          
            ("aaacaa", False),         
            ("aaabac", False),         
            ("aa", False),              
            ("", False),               
            ("aaabax", False),         
            ("aabbb", False),         
            ("aaaba", False),                  
        ]

        for input_string, expected in test_cases_bets:
            with self.subTest(input_string=input_string, expected=expected):
                result = bets_dfa.simulate(input_string)
                self.assertEqual(result['accepted'], expected, f"Input: {input_string}, Output: {result}, Expected: {expected}")

if __name__ == '__main__':
    unittest.main()