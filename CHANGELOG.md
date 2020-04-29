## 1.0.14 (29 Apr 2020)4
* Updated logo file

## 1.0.13 (29 Apr 2020)
* Added the GitGraphy: View the files with the most contributors to highlight the files changes by the highest 
amount of developers.

## 1.0.12 (28 Apr 2020)
* Extended the large file visualisation to support Windows
* Extend the large file visualisation to analyse all the files in the repo in the first scan and to reuse the scan when
  browsing through the pages

## 1.0.11 (27 Apr 2020)
* Ability to iterate through pages in the show files with the highest amount of commits.

## 1.0.8 (27 Apr 2020)
* Allow to iterate through the large files in the the large file command view.
* Improved visualisation for the large file view:
    1. Scale the y-axis to eb slightly over the highest value being displayed (1.1 times) and rounded to the closest multiple of ten
    2. Display the y-axis indicators on a basis equal to a tenth of the highest value for the axis (if the max value is 1400, it will show 140 increments)
    3. Display large files in an ascending order - left to right
    4. Display the unit close to the values on the y-axis

## 1.0.6 (26 Apr 2020)
* Added function to show the largest files in the repo.
* Improved visualisation for the commits per file command.

## 1.0.2 (01 Nov 2019)
* Support for multiple namespaces: when that is the case, the namespace for the current open file is taken.

## 1.0.1 (28 Oct 2019)
* Fixed issue https://github.com/marcopierobon/gitGraphy/issues/4 : Cannot run on git repos whose path contains spaces
* Set up jest for unit testing
* Layout correction on the README file

## 1.0.0 (27 Oct 2019)
* Initial release
